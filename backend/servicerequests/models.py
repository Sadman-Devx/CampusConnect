from django.db import models
from django.conf import settings


class ServiceRequest(models.Model):
    """
    FR-06 (part 2) -- Service Request & Complaint Tracking.

    Distinct from the chatbot's SupportTicket: this is a request the
    student submits directly through a form (not something the chatbot
    escalates), for anything that isn't tied to a specific advisor's
    time slot -- e.g. "my transcript has an error", "registration is
    broken for me", a general complaint, etc.
    """
    CATEGORY_CHOICES = (
        ('academic', 'Academic'),
        ('financial', 'Financial'),
        ('technical', 'Technical'),
        ('complaint', 'Complaint'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="service_requests",
        limit_choices_to={"role": "student"},
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    staff_note = models.CharField(max_length=500, blank=True)
    # Ownership gap fix: which staff member is currently handling this --
    # previously any advisor/admin saw the exact same flat inbox with no
    # way to tell if someone else was already on it. SET_NULL so removing
    # a staff account never deletes the request, just unclaims it.
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_service_requests",
        limit_choices_to={"role__in": ["advisor", "admin"]},
        help_text="Staff member currently handling this request. Optional -- an unclaimed request is still visible to everyone.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.id} {self.subject} ({self.status})"


class ServiceRequestAttachment(models.Model):
    """A file attached to a request -- either the student adding evidence
    (screenshot, transcript, error message) or staff adding a document
    back. Both sides can attach; ownership is checked in the view, not
    here."""
    request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="service_request_attachments/%Y/%m/")
    original_filename = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="service_request_attachments",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"{self.original_filename} on #{self.request_id}"


class ServiceRequestComment(models.Model):
    """
    Threaded back-and-forth on a single request. Previously the only
    communication channel was a single staff_note overwritten on every
    status change -- no real conversation, no history of what was said.
    staff_note is kept as-is (a short status-change summary); this is the
    actual thread.
    """
    request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="service_request_comments",
    )
    text = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author.username} on #{self.request_id}"