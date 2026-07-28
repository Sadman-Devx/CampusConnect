"""
FR-05 -- Predictive Analytics data model.
RiskScore: প্রতিবার compute হলে নতুন row (history রাখার জন্য, overwrite না)।
AdvisorAlert: advisor-এর worklist, lifecycle open -> acknowledged -> resolved।
"""
from django.conf import settings
from django.db import models


class RiskScore(models.Model):
    RISK_LOW = 'low'
    RISK_MEDIUM = 'medium'
    RISK_HIGH = 'high'
    RISK_LEVEL_CHOICES = (
        (RISK_LOW, 'Low'),
        (RISK_MEDIUM, 'Medium'),
        (RISK_HIGH, 'High'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='risk_scores',
    )
    probability = models.FloatField(help_text="Model's predicted probability of academic risk (0-1).")
    score = models.FloatField(help_text="Risk score on a 0-100 scale (higher = more at risk).")
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES)
    features = models.JSONField(default=dict, blank=True)
    top_factors = models.JSONField(default=list, blank=True)
    model_version = models.CharField(max_length=20, default='v1')
    computed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-computed_at']
        indexes = [
            models.Index(fields=['student', '-computed_at']),
            models.Index(fields=['risk_level']),
        ]

    def __str__(self):
        return f"{self.student.username}: {self.risk_level} ({self.score:.1f}) @ {self.computed_at:%Y-%m-%d}"


class AdvisorAlert(models.Model):
    SEVERITY_INFO = 'info'
    SEVERITY_WARNING = 'warning'
    SEVERITY_CRITICAL = 'critical'
    SEVERITY_CHOICES = (
        (SEVERITY_INFO, 'Info'),
        (SEVERITY_WARNING, 'Warning'),
        (SEVERITY_CRITICAL, 'Critical'),
    )

    STATUS_OPEN = 'open'
    STATUS_ACKNOWLEDGED = 'acknowledged'
    STATUS_RESOLVED = 'resolved'
    STATUS_CHOICES = (
        (STATUS_OPEN, 'Open'),
        (STATUS_ACKNOWLEDGED, 'Acknowledged'),
        (STATUS_RESOLVED, 'Resolved'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='advisor_alerts',
    )
    risk_score = models.ForeignKey(
        RiskScore, on_delete=models.CASCADE, related_name='alerts',
    )
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='acknowledged_alerts',
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['student', 'status']),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.student.username}: {self.reason} ({self.status})"