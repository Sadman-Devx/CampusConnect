from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import ServiceRequest
from .permissions import IsStudentRole, IsStaffRole
from .serializers import ServiceRequestSerializer, StaffStatusUpdateSerializer


class MyRequestListCreateView(generics.ListCreateAPIView):
    """Student-facing: submit a new request, and see the status of past ones."""
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsStudentRole]

    def get_queryset(self):
        return ServiceRequest.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class StaffRequestListView(generics.ListAPIView):
    """Advisor/admin-facing: every student's requests, optionally filtered by status."""
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsStaffRole]

    def get_queryset(self):
        qs = ServiceRequest.objects.all().select_related("student")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class UpdateRequestStatusView(APIView):
    """Advisor/admin moves a request through pending -> in_progress -> resolved."""
    permission_classes = [IsStaffRole]

    def patch(self, request, pk):
        serializer = StaffStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        req = ServiceRequest.objects.filter(pk=pk).first()
        if not req:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        req.status = serializer.validated_data["status"]
        if "staff_note" in serializer.validated_data:
            req.staff_note = serializer.validated_data["staff_note"]
        req.updated_at = timezone.now()
        req.save(update_fields=["status", "staff_note", "updated_at"])

        return Response(ServiceRequestSerializer(req).data)