from django.http import Http404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import ServiceRequest, ServiceRequestAttachment, ServiceRequestComment
from .permissions import IsStudentRole, IsStaffRole
from .serializers import (
    ServiceRequestSerializer, StaffStatusUpdateSerializer,
    ServiceRequestAttachmentSerializer, ServiceRequestAttachmentUploadSerializer,
    ServiceRequestCommentSerializer, ServiceRequestCommentCreateSerializer,
)


class MyRequestListCreateView(generics.ListCreateAPIView):
    """Student-facing: submit a new request, and see the status of past ones."""
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsStudentRole]

    def get_queryset(self):
        return ServiceRequest.objects.filter(student=self.request.user).select_related(
            "assigned_to"
        ).prefetch_related("attachments", "comments")

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class StaffRequestListView(generics.ListAPIView):
    """
    Advisor/admin-facing: every student's requests, optionally filtered by
    status and by ownership (?mine=1 for "assigned to me", ?unassigned=1
    for the unclaimed pool).
    """
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsStaffRole]

    def get_queryset(self):
        qs = ServiceRequest.objects.all().select_related("student", "assigned_to").prefetch_related(
            "attachments", "comments"
        )
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if self.request.query_params.get("mine"):
            qs = qs.filter(assigned_to_id=self.request.user.id)
        if self.request.query_params.get("unassigned"):
            qs = qs.filter(assigned_to__isnull=True)
        return qs


class ClaimRequestView(APIView):
    """
    Staff claims a request so it's clear who's handling it -- prevents two
    advisors working the same request without knowing it. Claiming an
    already-claimed request held by someone else is rejected; claiming
    your own already-claimed request is a harmless no-op.
    """
    permission_classes = [IsStaffRole]

    def post(self, request, pk):
        req = ServiceRequest.objects.select_related("assigned_to").filter(pk=pk).first()
        if not req:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if req.assigned_to_id and req.assigned_to_id != request.user.id:
            return Response(
                {"detail": f"Already claimed by {req.assigned_to.username}."},
                status=status.HTTP_409_CONFLICT,
            )
        req.assigned_to = request.user
        req.save(update_fields=["assigned_to"])
        return Response(ServiceRequestSerializer(req, context={"request": request}).data)


class ReleaseRequestView(APIView):
    """The current assignee (or an admin) hands the request back to the unclaimed pool."""
    permission_classes = [IsStaffRole]

    def post(self, request, pk):
        req = ServiceRequest.objects.select_related("assigned_to").filter(pk=pk).first()
        if not req:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if req.assigned_to_id and req.assigned_to_id != request.user.id and request.user.role != "admin":
            return Response(
                {"detail": f"Only {req.assigned_to.username} or an admin can release this."},
                status=status.HTTP_403_FORBIDDEN,
            )
        req.assigned_to = None
        req.save(update_fields=["assigned_to"])
        return Response(ServiceRequestSerializer(req, context={"request": request}).data)


class UpdateRequestStatusView(APIView):
    """
    Advisor/admin moves a request through pending -> in_progress -> resolved.

    Auto-claims an unclaimed request on the first status update, and
    blocks anyone but the current assignee (or an admin) from updating a
    request someone else already claimed -- closes the same "two advisors,
    one request" gap as ClaimRequestView, without adding an extra required
    step for the common case of just resolving something.
    """
    permission_classes = [IsStaffRole]

    def patch(self, request, pk):
        serializer = StaffStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        req = ServiceRequest.objects.select_related("assigned_to").filter(pk=pk).first()
        if not req:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if req.assigned_to_id and req.assigned_to_id != request.user.id and request.user.role != "admin":
            return Response(
                {"detail": f"This request is already being handled by {req.assigned_to.username}."},
                status=status.HTTP_409_CONFLICT,
            )

        if not req.assigned_to_id:
            req.assigned_to = request.user

        req.status = serializer.validated_data["status"]
        if "staff_note" in serializer.validated_data:
            req.staff_note = serializer.validated_data["staff_note"]
        req.updated_at = timezone.now()
        req.save(update_fields=["status", "staff_note", "assigned_to", "updated_at"])

        return Response(ServiceRequestSerializer(req, context={"request": request}).data)


def _get_owned_or_staffed_request(request, pk):
    """Shared lookup for attachments/comments: the request's own student,
    or any staff member, may read/write on it."""
    req = ServiceRequest.objects.filter(pk=pk).first()
    if not req:
        raise Http404
    is_owner = req.student_id == request.user.id
    is_staff = request.user.role in ("advisor", "admin")
    if not (is_owner or is_staff):
        raise PermissionDenied("Not allowed.")
    return req


class RequestAttachmentUploadView(APIView):
    """Student (on their own request) or staff (any request) attaches a
    file -- screenshots, transcripts, error messages, supporting docs."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        req = _get_owned_or_staffed_request(request, pk)

        serializer = ServiceRequestAttachmentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded_file = serializer.validated_data["file"]

        attachment = ServiceRequestAttachment.objects.create(
            request=req, file=uploaded_file, uploaded_by=request.user,
            original_filename=uploaded_file.name,
        )
        return Response(
            ServiceRequestAttachmentSerializer(attachment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class RequestCommentCreateView(APIView):
    """Student or staff posts a reply in the request's thread."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        req = _get_owned_or_staffed_request(request, pk)

        serializer = ServiceRequestCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = ServiceRequestComment.objects.create(
            request=req, author=request.user, text=serializer.validated_data["text"],
        )
        return Response(ServiceRequestCommentSerializer(comment).data, status=status.HTTP_201_CREATED)