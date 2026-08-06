from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from .models import (
    AdvisorProfile, AdvisorAvailability, AppointmentBooking,
    AdvisorAvailabilityRecurringRule,
)

User = get_user_model()


class StudentAssignmentSerializer(serializers.ModelSerializer):
    """Admin-facing: student row with their current advisor assignment."""
    advisor_username = serializers.CharField(source="advisor.username", read_only=True, default=None)

    class Meta:
        model = User
        fields = ["id", "username", "email", "major", "academic_year", "advisor", "advisor_username"]
        read_only_fields = ["id", "username", "email", "major", "academic_year", "advisor_username"]


class AssignAdvisorSerializer(serializers.Serializer):
    """advisor_id may be null to unassign a student."""
    advisor_id = serializers.IntegerField(allow_null=True)

    def validate_advisor_id(self, value):
        if value is None:
            return value
        if not User.objects.filter(pk=value, role="advisor").exists():
            raise serializers.ValidationError("That advisor doesn't exist.")
        return value


class AdvisorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvisorProfile
        fields = ["bio", "department", "specialization", "office_location", "years_experience", "updated_at"]
        read_only_fields = ["updated_at"]


class AdvisorListSerializer(serializers.ModelSerializer):
    """Rich advisor info for the student-facing "pick an advisor" list --
    enough for a student to compare advisors and choose based on fit,
    not just name and open-slot count."""
    open_slot_count = serializers.SerializerMethodField()
    bio = serializers.CharField(source="advisor_profile.bio", read_only=True, default="")
    department = serializers.CharField(source="advisor_profile.department", read_only=True, default="")
    specialization = serializers.CharField(source="advisor_profile.specialization", read_only=True, default="")
    office_location = serializers.CharField(source="advisor_profile.office_location", read_only=True, default="")
    years_experience = serializers.IntegerField(source="advisor_profile.years_experience", read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "open_slot_count",
            "bio", "department", "specialization", "office_location", "years_experience",
        ]

    def get_open_slot_count(self, obj):
        today = timezone.localdate()
        return sum(1 for slot in obj.availability_slots.filter(date__gte=today) if slot.is_open)


class AdvisorAvailabilitySerializer(serializers.ModelSerializer):
    advisor_username = serializers.CharField(source="advisor.username", read_only=True)
    is_open = serializers.BooleanField(read_only=True)

    class Meta:
        model = AdvisorAvailability
        fields = [
            "id", "advisor", "advisor_username", "date", "start_time", "end_time",
            "is_active", "is_open", "created_at",
        ]
        read_only_fields = ["id", "advisor", "advisor_username", "is_open", "created_at"]

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        date = attrs.get("date", getattr(self.instance, "date", None))

        if start and end and start >= end:
            raise serializers.ValidationError("End time must be after start time.")
        if date and date < timezone.localdate():
            raise serializers.ValidationError("Can't open a slot in the past.")
        return attrs


class AdvisorAvailabilityRecurringRuleSerializer(serializers.ModelSerializer):
    """Advisor-facing: define a repeating weekly availability rule
    (e.g. "every Monday 2-4 PM"). Concrete AdvisorAvailability rows are
    generated from this by recurring.sync_recurring_slots."""
    weekday_display = serializers.CharField(source="get_weekday_display", read_only=True)

    class Meta:
        model = AdvisorAvailabilityRecurringRule
        fields = [
            "id", "weekday", "weekday_display", "start_time", "end_time",
            "effective_until", "is_active", "created_at",
        ]
        read_only_fields = ["id", "weekday_display", "created_at"]

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and start >= end:
            raise serializers.ValidationError("End time must be after start time.")
        return attrs


class AppointmentBookingSerializer(serializers.ModelSerializer):
    """Used for both the student's own booking list and the advisor's pending queue."""
    student_username = serializers.CharField(source="student.username", read_only=True)
    advisor_username = serializers.CharField(source="slot.advisor.username", read_only=True)
    slot_date = serializers.DateField(source="slot.date", read_only=True)
    slot_start_time = serializers.TimeField(source="slot.start_time", read_only=True)
    slot_end_time = serializers.TimeField(source="slot.end_time", read_only=True)
    # Advisor context so "My Appointments" doesn't just show a bare username --
    # same graceful-empty-string-default pattern as AdvisorListSerializer.
    advisor_department = serializers.CharField(source="slot.advisor.advisor_profile.department", read_only=True, default="")
    advisor_specialization = serializers.CharField(source="slot.advisor.advisor_profile.specialization", read_only=True, default="")
    advisor_office_location = serializers.CharField(source="slot.advisor.advisor_profile.office_location", read_only=True, default="")

    # Advisor-side gap fix: student's academic profile right on the
    # booking, so an advisor isn't approving/rejecting blind.
    student_major = serializers.CharField(source="student.major", read_only=True, default="")
    student_academic_year = serializers.CharField(source="student.academic_year", read_only=True, default="")
    student_gpa = serializers.DecimalField(source="student.gpa", read_only=True, max_digits=3, decimal_places=2, default=None)
    # Whether that GPA has been confirmed by the student's assigned
    # advisor/admin against an official record -- see users.VerifyStudentGpaView.
    student_gpa_verified = serializers.SerializerMethodField()

    # Reschedule-proposal context, populated only when status == reschedule_proposed.
    proposed_slot_date = serializers.DateField(source="proposed_slot.date", read_only=True, default=None)
    proposed_slot_start_time = serializers.TimeField(source="proposed_slot.start_time", read_only=True, default=None)
    proposed_slot_end_time = serializers.TimeField(source="proposed_slot.end_time", read_only=True, default=None)

    class Meta:
        model = AppointmentBooking
        fields = [
            "id", "student", "student_username",
            "student_major", "student_academic_year", "student_gpa", "student_gpa_verified",
            "slot", "advisor_username",
            "advisor_department", "advisor_specialization", "advisor_office_location",
            "slot_date", "slot_start_time", "slot_end_time",
            "proposed_slot", "proposed_slot_date", "proposed_slot_start_time", "proposed_slot_end_time",
            "status", "reason", "advisor_note", "requested_at", "decided_at",
        ]
        read_only_fields = [
            "id", "student", "student_username",
            "student_major", "student_academic_year", "student_gpa", "student_gpa_verified",
            "advisor_username",
            "advisor_department", "advisor_specialization", "advisor_office_location",
            "slot_date", "slot_start_time", "slot_end_time",
            "proposed_slot", "proposed_slot_date", "proposed_slot_start_time", "proposed_slot_end_time",
            "status", "advisor_note", "requested_at", "decided_at",
        ]

    def get_student_gpa_verified(self, obj):
        return obj.student.gpa is not None and obj.student.gpa_verified_at is not None

    def validate_slot(self, slot):
        if not slot.is_open:
            raise serializers.ValidationError("This slot is no longer open for requests.")
        return slot


class BookingDecisionSerializer(serializers.Serializer):
    """Advisor approves or rejects a pending request."""
    status = serializers.ChoiceField(choices=[AppointmentBooking.STATUS_APPROVED, AppointmentBooking.STATUS_REJECTED])
    advisor_note = serializers.CharField(max_length=300, required=False, allow_blank=True)


class ProposeRescheduleSerializer(serializers.Serializer):
    """Advisor proposes one of their own open slots instead of the originally requested one."""
    proposed_slot = serializers.PrimaryKeyRelatedField(queryset=AdvisorAvailability.objects.all())
    advisor_note = serializers.CharField(max_length=300, required=False, allow_blank=True)


class RescheduleResponseSerializer(serializers.Serializer):
    """Student accepts or declines the advisor's proposed alternate slot."""
    accept = serializers.BooleanField()