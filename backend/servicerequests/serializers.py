from rest_framework import serializers
from .models import ServiceRequest


class ServiceRequestSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            "id", "student", "student_username", "category", "subject", "description",
            "status", "staff_note", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "student", "student_username", "status", "staff_note", "created_at", "updated_at",
        ]


class StaffStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[c[0] for c in ServiceRequest.STATUS_CHOICES])
    staff_note = serializers.CharField(max_length=500, required=False, allow_blank=True)