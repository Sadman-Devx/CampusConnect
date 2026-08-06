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


class CourseEnrollment(models.Model):
    """FR-02/FR-06 -- a real (not just catalog-browsing) course registration.
    Seat count is decremented atomically on enroll (see views.EnrollCourseView)
    and restored on drop."""
    STATUS_ENROLLED = "enrolled"
    STATUS_DROPPED = "dropped"
    STATUS_CHOICES = ((STATUS_ENROLLED, "Enrolled"), (STATUS_DROPPED, "Dropped"))

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="course_enrollments", limit_choices_to={"role": "student"},
    )
    course = models.ForeignKey(RegistrationItem, on_delete=models.CASCADE, related_name="enrollments")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_ENROLLED)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    dropped_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            # A student can only be actively enrolled in a given course once --
            # doesn't block re-enrolling after a drop.
            models.UniqueConstraint(
                fields=["student", "course"],
                condition=models.Q(status="enrolled"),
                name="one_active_enrollment_per_student_per_course",
            )
        ]

    def __str__(self):
        return f"{self.student.username} -> {self.course.course_code} ({self.status})"


class ScholarshipApplication(models.Model):
    """FR-04 -- a real application record created when a student clicks
    Apply on a recommended (or catalog-browsed) scholarship."""
    STATUS_SUBMITTED = "submitted"
    STATUS_UNDER_REVIEW = "under_review"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = (
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_UNDER_REVIEW, "Under Review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="scholarship_applications", limit_choices_to={"role": "student"},
    )
    financial_aid_item = models.ForeignKey(FinancialAidItem, on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_SUBMITTED)
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "financial_aid_item"], name="one_application_per_student_per_scholarship"
            )
        ]

    def __str__(self):
        return f"{self.student.username} -> {self.financial_aid_item.title} ({self.status})"


class EventRSVP(models.Model):
    """FR-04 -- a real RSVP record created when a student clicks RSVP on
    a recommended (or catalog-browsed) event."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="event_rsvps", limit_choices_to={"role": "student"},
    )
    event = models.ForeignKey(EventItem, on_delete=models.CASCADE, related_name="rsvps")
    rsvp_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "event"], name="one_rsvp_per_student_per_event")
        ]

    def __str__(self):
        return f"{self.student.username} -> {self.event.title}"


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