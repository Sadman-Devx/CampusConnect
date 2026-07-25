from django.db import models
from django.conf import settings


class AdvisingItem(models.Model):
    title = models.CharField(max_length=200)
    advisor_name = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, default="Available")
    description = models.TextField(blank=True)

    def __str__(self):
        return self.title


class FinancialAidItem(models.Model):
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)

    # --- FR-04: eligibility criteria used by the content-based recommender ---
    eligible_majors = models.JSONField(
        default=list, blank=True,
        help_text="List of eligible majors, e.g. ['Computer Science']. Empty list = open to all majors."
    )
    eligible_years = models.JSONField(
        default=list, blank=True,
        help_text="List of eligible academic years, e.g. ['Junior', 'Senior']. Empty list = open to all years."
    )
    min_gpa = models.DecimalField(
        max_digits=3, decimal_places=2, null=True, blank=True,
        help_text="Minimum GPA required (0.00-4.00). Blank = no GPA requirement."
    )

    def __str__(self):
        return self.title


class RegistrationItem(models.Model):
    course_code = models.CharField(max_length=20)
    course_title = models.CharField(max_length=200)
    seats_available = models.IntegerField(default=0)
    schedule = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.course_code} - {self.course_title}"


class EventItem(models.Model):
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=150, blank=True)
    date = models.DateTimeField()
    description = models.TextField(blank=True)

    # --- FR-04: eligibility/targeting criteria used by the content-based recommender ---
    eligible_majors = models.JSONField(
        default=list, blank=True,
        help_text="List of target majors, e.g. ['Computer Science']. Empty list = open to all majors."
    )
    eligible_years = models.JSONField(
        default=list, blank=True,
        help_text="List of target academic years. Empty list = open to all years."
    )

    def __str__(self):
        return self.title


class NavigationLog(models.Model):
    WIDGET_CHOICES = (
        ('advising', 'Advising'),
        ('financial_aid', 'Financial Aid'),
        ('registration', 'Registration'),
        ('events', 'Events'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="navigation_logs")
    widget = models.CharField(max_length=20, choices=WIDGET_CHOICES)
    clicked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.widget} @ {self.clicked_at}"