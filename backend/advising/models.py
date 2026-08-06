from django.db import models
from django.conf import settings


class AdvisorProfile(models.Model):
    """
    FR-06 -- lets an advisor describe themselves (bio, department,
    specialization) so a student picking between multiple advisors can
    choose based on fit, not just name and open-slot count.

    OneToOne rather than piling more fields onto User: this data is
    advisor-only and would otherwise sit unused on every student/admin row.
    Created lazily (get_or_create) the first time an advisor edits it, so
    an advisor who hasn't filled anything in yet simply has no row.
    """
    advisor = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="advisor_profile",
        limit_choices_to={"role": "advisor"},
    )
    bio = models.TextField(blank=True, max_length=1000)
    department = models.CharField(max_length=150, blank=True)
    specialization = models.CharField(
        max_length=200, blank=True,
        help_text="e.g. Academic advising, Career guidance, Course planning",
    )
    office_location = models.CharField(max_length=150, blank=True)
    years_experience = models.PositiveIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.advisor.username}"


class AdvisorAvailability(models.Model):
    """
    A single bookable time slot an advisor has opened up.

    Kept deliberately simple for the MVP -- an advisor adds explicit
    one-off slots (date + start/end time). Slots can also be generated in
    bulk from an AdvisorAvailabilityRecurringRule (see recurring.py) --
    once generated, a recurring-sourced slot is just a normal row here and
    the rest of the app (booking, calendar, is_open, etc.) treats it
    identically to a manually added one.
    """
    advisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="availability_slots",
        limit_choices_to={"role": "advisor"},
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    # An advisor can withdraw a slot they no longer want to offer. Slots
    # that already have an approved booking should not be deactivated
    # silently -- the view layer blocks that and requires cancelling the
    # booking first, so the student is never left with no visibility.
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.advisor.username} — {self.date} {self.start_time}-{self.end_time}"

    @property
    def has_approved_booking(self):
        return self.bookings.filter(status=AppointmentBooking.STATUS_APPROVED).exists()

    @property
    def is_open(self):
        """Bookable right now: active, in the future-ish, and not already claimed."""
        return self.is_active and not self.has_approved_booking


class AdvisorAvailabilityRecurringRule(models.Model):
    """
    Lets an advisor define a repeating weekly pattern ("every Monday
    2-4 PM") instead of adding one-off AdvisorAvailability slots by hand
    every week.

    This model is the *rule*; concrete AdvisorAvailability rows are
    generated from it (see recurring.sync_recurring_slots) for a rolling
    horizon so the rest of the app never has to know a slot came from a
    rule -- it's just a normal AdvisorAvailability row underneath.
    """
    WEEKDAY_CHOICES = (
        (0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"),
        (4, "Friday"), (5, "Saturday"), (6, "Sunday"),
    )

    advisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="recurring_rules",
        limit_choices_to={"role": "advisor"},
    )
    weekday = models.PositiveSmallIntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    # Rule stops generating new slots after this date; slots already
    # generated are left alone -- an advisor going on leave shouldn't
    # retroactively cancel appointments already booked before they set
    # the end date.
    effective_until = models.DateField(
        null=True, blank=True,
        help_text="Optional last date this rule should generate slots for. Leave blank for no end date.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["weekday", "start_time"]

    def __str__(self):
        return f"{self.advisor.username} — every {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class AppointmentBooking(models.Model):
    """
    A student's request to meet an advisor during one of their open slots.

    Multiple students may request the same slot (first-come-first-served
    isn't enforced at request time) -- the advisor picks who to approve.
    The moment one request is approved, every other pending request on
    that same slot is automatically rejected. See AppointmentBookingSerializer
    / views.ApproveBookingView for the transaction that guarantees this
    can't race into two approved bookings for one slot.

    An advisor can also, instead of a flat approve/reject, propose a
    different one of their own open slots (proposed_slot) -- the booking
    moves to STATUS_RESCHEDULE_PROPOSED and waits on the student to accept
    or decline via views.RespondRescheduleView. The original slot is left
    untouched until the student responds, so a decline just falls back to
    pending.
    """
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELLED = "cancelled"
    STATUS_RESCHEDULE_PROPOSED = "reschedule_proposed"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_RESCHEDULE_PROPOSED, "Reschedule proposed"),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="appointment_bookings",
        limit_choices_to={"role": "student"},
    )
    slot = models.ForeignKey(AdvisorAvailability, on_delete=models.CASCADE, related_name="bookings")
    # Advisor's alternate offer when they can't take the originally
    # requested slot. Only meaningful while status == reschedule_proposed;
    # cleared again once the student accepts or declines.
    proposed_slot = models.ForeignKey(
        AdvisorAvailability, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reschedule_proposals",
        help_text="Alternate slot the advisor has proposed instead of the originally requested one.",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    reason = models.CharField(max_length=300, blank=True, help_text="What the student wants to discuss.")
    advisor_note = models.CharField(max_length=300, blank=True, help_text="Advisor's note when approving/rejecting.")
    requested_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]
        # A student can only have one active (pending/approved) request per slot --
        # doesn't stop them re-requesting after a rejection/cancellation.
        constraints = [
            models.UniqueConstraint(
                fields=["student", "slot"],
                condition=models.Q(status__in=["pending", "approved"]),
                name="one_active_request_per_student_per_slot",
            )
        ]

    def __str__(self):
        return f"{self.student.username} -> {self.slot} ({self.status})"