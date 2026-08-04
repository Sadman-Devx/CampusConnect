from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import AdvisorProfile, AdvisorAvailability, AppointmentBooking
from .permissions import IsAdvisorRole, IsStudentRole, IsOwnerAdvisor
from .serializers import (
    AdvisorProfileSerializer, AdvisorListSerializer, AdvisorAvailabilitySerializer,
    AppointmentBookingSerializer, BookingDecisionSerializer,
)

User = get_user_model()


class MyAdvisorProfileView(APIView):
    """Advisor views/edits their own bio, department, specialization, etc.
    Created lazily on first save -- an advisor who never fills this in
    simply has no AdvisorProfile row, and the list/detail views degrade
    gracefully (blank fields) rather than erroring."""
    permission_classes = [IsAdvisorRole]

    def get(self, request):
        profile, _ = AdvisorProfile.objects.get_or_create(advisor=request.user)
        return Response(AdvisorProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = AdvisorProfile.objects.get_or_create(advisor=request.user)
        serializer = AdvisorProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdvisorListView(generics.ListAPIView):
    """Student-facing: browse advisors to pick one to book with."""
    serializer_class = AdvisorListSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.filter(role="advisor").select_related("advisor_profile").order_by("username")


class OpenSlotListView(generics.ListAPIView):
    """Student-facing: open (bookable) slots for a given advisor."""
    serializer_class = AdvisorAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        advisor_id = self.request.query_params.get("advisor")
        today = timezone.localdate()
        qs = AdvisorAvailability.objects.filter(is_active=True, date__gte=today)
        if advisor_id:
            qs = qs.filter(advisor_id=advisor_id)
        # is_open also excludes slots with an approved booking -- filter in
        # Python since it depends on a related-row check per slot.
        return [slot for slot in qs if slot.is_open]


class MySlotListCreateView(generics.ListCreateAPIView):
    """Advisor-facing: manage own slots (all of them, not just open ones)."""
    serializer_class = AdvisorAvailabilitySerializer
    permission_classes = [IsAdvisorRole]

    def get_queryset(self):
        return AdvisorAvailability.objects.filter(advisor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(advisor=self.request.user)


class MySlotDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Advisor withdraws (deactivates) or deletes their own slot."""
    serializer_class = AdvisorAvailabilitySerializer
    permission_classes = [IsAdvisorRole, IsOwnerAdvisor]
    queryset = AdvisorAvailability.objects.all()

    def destroy(self, request, *args, **kwargs):
        slot = self.get_object()
        if slot.has_approved_booking:
            return Response(
                {"detail": "This slot has a confirmed booking. Cancel that booking first."},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


class MyBookingListCreateView(generics.ListCreateAPIView):
    """Student-facing: request a slot, and see the status of past requests."""
    serializer_class = AppointmentBookingSerializer
    permission_classes = [IsStudentRole]

    def get_queryset(self):
        return AppointmentBooking.objects.filter(student=self.request.user).select_related("slot", "slot__advisor")

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class CancelBookingView(APIView):
    """Student withdraws their own pending/approved request."""
    permission_classes = [IsStudentRole]

    def post(self, request, pk):
        booking = AppointmentBooking.objects.filter(pk=pk, student=request.user).first()
        if not booking:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if booking.status not in (AppointmentBooking.STATUS_PENDING, AppointmentBooking.STATUS_APPROVED):
            return Response({"detail": "This booking can't be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = AppointmentBooking.STATUS_CANCELLED
        booking.decided_at = timezone.now()
        booking.save(update_fields=["status", "decided_at"])
        return Response(AppointmentBookingSerializer(booking).data)


class PendingBookingListView(generics.ListAPIView):
    """Advisor-facing: pending requests across all of the advisor's own slots."""
    serializer_class = AppointmentBookingSerializer
    permission_classes = [IsAdvisorRole]

    def get_queryset(self):
        return (
            AppointmentBooking.objects
            .filter(slot__advisor=self.request.user, status=AppointmentBooking.STATUS_PENDING)
            .select_related("slot", "student")
        )


class DecideBookingView(APIView):
    """
    Advisor approves or rejects a pending request.

    Approval is the one place a genuine race condition can happen: two
    students' requests on the same slot, and the advisor (or a double
    click) tries to approve both. select_for_update() locks the slot's
    booking rows for the duration of the transaction so a second,
    concurrent approval attempt blocks until the first commits -- by
    which point the slot is no longer open and the second approval is
    rejected with a clear error instead of silently double-booking.
    """
    permission_classes = [IsAdvisorRole]

    def patch(self, request, pk):
        serializer = BookingDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        advisor_note = serializer.validated_data.get("advisor_note", "")

        with transaction.atomic():
            booking = (
                AppointmentBooking.objects
                .select_for_update()
                .filter(pk=pk, slot__advisor=request.user)
                .select_related("slot")
                .first()
            )
            if not booking:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            if booking.status != AppointmentBooking.STATUS_PENDING:
                return Response({"detail": "This request has already been decided."}, status=status.HTTP_400_BAD_REQUEST)

            if new_status == AppointmentBooking.STATUS_APPROVED:
                # Lock every other request on this slot too, then reject them
                # all atomically in the same transaction as the approval.
                siblings = (
                    AppointmentBooking.objects
                    .select_for_update()
                    .filter(slot=booking.slot, status=AppointmentBooking.STATUS_PENDING)
                    .exclude(pk=booking.pk)
                )
                sibling_ids = list(siblings.values_list("pk", flat=True))
                if sibling_ids:
                    AppointmentBooking.objects.filter(pk__in=sibling_ids).update(
                        status=AppointmentBooking.STATUS_REJECTED,
                        advisor_note="This slot was booked by another student.",
                        decided_at=timezone.now(),
                    )

            booking.status = new_status
            booking.advisor_note = advisor_note
            booking.decided_at = timezone.now()
            booking.save(update_fields=["status", "advisor_note", "decided_at"])

        return Response(AppointmentBookingSerializer(booking).data)