from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from .models import AdvisorAvailability, AppointmentBooking

User = get_user_model()


class AdvisorListSerializer(serializers.ModelSerializer):
    """Minimal advisor info for the student-facing "pick an advisor" list."""
    open_slot_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "open_slot_count"]

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


class AppointmentBookingSerializer(serializers.ModelSerializer):
    """Used for both the student's own booking list and the advisor's pending queue."""
    student_username = serializers.CharField(source="student.username", read_only=True)
    advisor_username = serializers.CharField(source="slot.advisor.username", read_only=True)
    slot_date = serializers.DateField(source="slot.date", read_only=True)
    slot_start_time = serializers.TimeField(source="slot.start_time", read_only=True)
    slot_end_time = serializers.TimeField(source="slot.end_time", read_only=True)

    class Meta:
        model = AppointmentBooking
        fields = [
            "id", "student", "student_username", "slot", "advisor_username",
            "slot_date", "slot_start_time", "slot_end_time",
            "status", "reason", "advisor_note", "requested_at", "decided_at",
        ]
        read_only_fields = [
            "id", "student", "student_username", "advisor_username",
            "slot_date", "slot_start_time", "slot_end_time",
            "status", "advisor_note", "requested_at", "decided_at",
        ]

    def validate_slot(self, slot):
        if not slot.is_open:
            raise serializers.ValidationError("This slot is no longer open for requests.")
        return slot


class BookingDecisionSerializer(serializers.Serializer):
    """Advisor approves or rejects a pending request."""
    status = serializers.ChoiceField(choices=[AppointmentBooking.STATUS_APPROVED, AppointmentBooking.STATUS_REJECTED])
    advisor_note = serializers.CharField(max_length=300, required=False, allow_blank=True)