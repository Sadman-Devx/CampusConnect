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