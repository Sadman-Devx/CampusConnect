from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    AdvisorProfile, AdvisorAvailability, AppointmentBooking,
    AdvisorAvailabilityRecurringRule,
)
from .permissions import IsAdvisorRole, IsAdminRole, IsStudentRole, IsOwnerAdvisor
from .recurring import sync_recurring_slots
from .serializers import (
    AdvisorProfileSerializer, AdvisorListSerializer, AdvisorAvailabilitySerializer,
    AppointmentBookingSerializer, BookingDecisionSerializer,
    StudentAssignmentSerializer, AssignAdvisorSerializer,
    AdvisorAvailabilityRecurringRuleSerializer,
    ProposeRescheduleSerializer, RescheduleResponseSerializer,
)

User = get_user_model()


class StudentAssignmentListView(generics.ListAPIView):
    """Admin-facing: every student with their current advisor (or none)."""
    serializer_class = StudentAssignmentSerializer
    permission_classes = [IsAdminRole]
    queryset = User.objects.filter(role="student").select_related("advisor").order_by("username")


class AssignAdvisorView(APIView):
    """Admin assigns (or clears, via advisor_id: null) a student's advisor."""
    permission_classes = [IsAdminRole]

    def patch(self, request, student_id):
        student = User.objects.filter(pk=student_id, role="student").first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AssignAdvisorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student.advisor_id = serializer.validated_data["advisor_id"]
        student.save(update_fields=["advisor"])
        return Response(StudentAssignmentSerializer(student).data)


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
        if advisor_id:
            # Top up recurring-rule-generated slots before listing, so a
            # student browsing never sees a gap just because nobody has
            # hit the advisor's own slot endpoints recently.
            advisor = User.objects.filter(pk=advisor_id, role="advisor").first()
            if advisor:
                sync_recurring_slots(advisor)
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
        sync_recurring_slots(self.request.user)
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


class MyRecurringRuleListCreateView(generics.ListCreateAPIView):
    """Advisor-facing: define/list recurring weekly availability rules
    ("every Monday 2-4 PM") so they don't have to add one-off slots by
    hand every week."""
    serializer_class = AdvisorAvailabilityRecurringRuleSerializer
    permission_classes = [IsAdvisorRole]

    def get_queryset(self):
        return AdvisorAvailabilityRecurringRule.objects.filter(advisor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(advisor=self.request.user)
        sync_recurring_slots(self.request.user)


class MyRecurringRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Advisor edits or deletes their own recurring rule. Deleting/deactivating
    only stops future generation -- already-generated slots (and any
    bookings on them) are left alone."""
    serializer_class = AdvisorAvailabilityRecurringRuleSerializer
    permission_classes = [IsAdvisorRole, IsOwnerAdvisor]
    queryset = AdvisorAvailabilityRecurringRule.objects.all()

    def perform_update(self, serializer):
        serializer.save()
        sync_recurring_slots(self.request.user)


class MyBookingListCreateView(generics.ListCreateAPIView):
    """Student-facing: request a slot, and see the status of past requests."""
    serializer_class = AppointmentBookingSerializer
    permission_classes = [IsStudentRole]

    def get_queryset(self):
        return AppointmentBooking.objects.filter(student=self.request.user).select_related(
            "slot", "slot__advisor", "slot__advisor__advisor_profile", "proposed_slot"
        )

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


class RespondRescheduleView(APIView):
    """Student accepts or declines the advisor's proposed alternate slot."""
    permission_classes = [IsStudentRole]

    def post(self, request, pk):
        serializer = RescheduleResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        accept = serializer.validated_data["accept"]

        with transaction.atomic():
            booking = (
                AppointmentBooking.objects
                .select_for_update()
                .filter(pk=pk, student=request.user, status=AppointmentBooking.STATUS_RESCHEDULE_PROPOSED)
                .select_related("proposed_slot")
                .first()
            )
            if not booking:
                return Response({"detail": "Not found or no proposal pending."}, status=status.HTTP_404_NOT_FOUND)

            if not accept:
                # Fall back to pending on the original slot -- the advisor
                # can decide normally, or propose a different time again.
                booking.status = AppointmentBooking.STATUS_PENDING
                booking.proposed_slot = None
                booking.save(update_fields=["status", "proposed_slot"])
                return Response(AppointmentBookingSerializer(booking).data)

            new_slot = booking.proposed_slot
            if not new_slot or not new_slot.is_open:
                return Response(
                    {"detail": "That slot is no longer available. Ask your advisor to propose another time."},
                    status=status.HTTP_409_CONFLICT,
                )

            # Same sibling-rejection guarantee as DecideBookingView --
            # accepting a reschedule is effectively an approval on the new slot.
            siblings = (
                AppointmentBooking.objects
                .select_for_update()
                .filter(slot=new_slot, status=AppointmentBooking.STATUS_PENDING)
                .exclude(pk=booking.pk)
            )
            sibling_ids = list(siblings.values_list("pk", flat=True))
            if sibling_ids:
                AppointmentBooking.objects.filter(pk__in=sibling_ids).update(
                    status=AppointmentBooking.STATUS_REJECTED,
                    advisor_note="This slot was booked by another student.",
                    decided_at=timezone.now(),
                )

            booking.slot = new_slot
            booking.proposed_slot = None
            booking.status = AppointmentBooking.STATUS_APPROVED
            booking.decided_at = timezone.now()
            booking.save(update_fields=["slot", "proposed_slot", "status", "decided_at"])

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


class PendingBookingCountView(APIView):
    """
    Advisor-facing: cheap poll target for a "new request" notification
    badge. Returns the pending count plus the most recent request
    timestamp so the frontend can detect "something changed since I last
    looked" without re-fetching the full pending list every tick.
    """
    permission_classes = [IsAdvisorRole]

    def get(self, request):
        pending = AppointmentBooking.objects.filter(
            slot__advisor=request.user, status=AppointmentBooking.STATUS_PENDING
        )
        latest = pending.order_by("-requested_at").values_list("requested_at", flat=True).first()
        return Response({"count": pending.count(), "latest_requested_at": latest})


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


class ProposeRescheduleView(APIView):
    """
    Advisor-facing gap fix: instead of only approve/reject, an advisor can
    propose a different one of their own open slots. The booking moves to
    'reschedule_proposed' and waits on the student to accept/decline via
    RespondRescheduleView -- the original slot is untouched until then, so
    declining just falls back to the normal pending decision.
    """
    permission_classes = [IsAdvisorRole]

    def patch(self, request, pk):
        serializer = ProposeRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        proposed_slot = serializer.validated_data["proposed_slot"]
        advisor_note = serializer.validated_data.get("advisor_note", "")

        booking = AppointmentBooking.objects.filter(
            pk=pk, slot__advisor=request.user, status=AppointmentBooking.STATUS_PENDING
        ).select_related("slot").first()
        if not booking:
            return Response({"detail": "Not found or not pending."}, status=status.HTTP_404_NOT_FOUND)

        if proposed_slot.advisor_id != request.user.id:
            return Response({"detail": "That slot isn't yours."}, status=status.HTTP_400_BAD_REQUEST)
        if not proposed_slot.is_open:
            return Response({"detail": "That slot isn't open."}, status=status.HTTP_400_BAD_REQUEST)
        if proposed_slot.pk == booking.slot_id:
            return Response({"detail": "That's the slot already requested."}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = AppointmentBooking.STATUS_RESCHEDULE_PROPOSED
        booking.proposed_slot = proposed_slot
        booking.advisor_note = advisor_note
        booking.save(update_fields=["status", "proposed_slot", "advisor_note"])
        return Response(AppointmentBookingSerializer(booking).data)