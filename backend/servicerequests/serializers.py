from rest_framework import serializers
from .models import ServiceRequest, ServiceRequestAttachment, ServiceRequestComment

ALLOWED_ATTACHMENT_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif", "doc", "docx", "txt"}
MAX_ATTACHMENT_SIZE_MB = 10


class ServiceRequestAttachmentSerializer(serializers.ModelSerializer):
    """Read-only, nested inside ServiceRequestSerializer -- uploading goes
    through RequestAttachmentUploadView / ServiceRequestAttachmentUploadSerializer instead."""
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequestAttachment
        fields = ["id", "file_url", "original_filename", "uploaded_by_username", "uploaded_at"]
        read_only_fields = fields

    def get_file_url(self, obj):
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class ServiceRequestAttachmentUploadSerializer(serializers.Serializer):
    """Write-only input for RequestAttachmentUploadView."""
    file = serializers.FileField()

    def validate_file(self, value):
        ext = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if ext not in ALLOWED_ATTACHMENT_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(ALLOWED_ATTACHMENT_EXTENSIONS))}."
            )
        if value.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024:
            raise serializers.ValidationError(f"File is too large. Max size is {MAX_ATTACHMENT_SIZE_MB}MB.")
        return value


class ServiceRequestCommentSerializer(serializers.ModelSerializer):
    """Read-only, nested inside ServiceRequestSerializer."""
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_role = serializers.CharField(source="author.role", read_only=True)

    class Meta:
        model = ServiceRequestComment
        fields = ["id", "author_username", "author_role", "text", "created_at"]
        read_only_fields = fields


class ServiceRequestCommentCreateSerializer(serializers.Serializer):
    """Write-only input for RequestCommentCreateView."""
    text = serializers.CharField(max_length=2000)


class ServiceRequestSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source="student.username", read_only=True)
    assigned_to_username = serializers.CharField(source="assigned_to.username", read_only=True, default=None)
    attachments = ServiceRequestAttachmentSerializer(many=True, read_only=True)
    comments = ServiceRequestCommentSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            "id", "student", "student_username", "category", "subject", "description",
            "status", "staff_note", "assigned_to", "assigned_to_username",
            "attachments", "comments", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "student", "student_username", "status", "staff_note",
            "assigned_to", "assigned_to_username", "attachments", "comments",
            "created_at", "updated_at",
        ]


class StaffStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[c[0] for c in ServiceRequest.STATUS_CHOICES])
    staff_note = serializers.CharField(max_length=500, required=False, allow_blank=True)