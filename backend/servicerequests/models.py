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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.id} {self.subject} ({self.status})"