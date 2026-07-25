from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('advisor', 'Advisor'),
        ('admin', 'Admin'),
    )

    # Used by the FR-04 content-based recommendation engine to match
    # students against scholarship / event eligibility criteria.
    ACADEMIC_YEAR_CHOICES = (
        ('Freshman', 'Freshman'),
        ('Sophomore', 'Sophomore'),
        ('Junior', 'Junior'),
        ('Senior', 'Senior'),
        ('Graduate', 'Graduate'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    is_verified = models.BooleanField(default=False)

    academic_year = models.CharField(
        max_length=20, choices=ACADEMIC_YEAR_CHOICES, blank=True, null=True,
        help_text="Student's current academic year (used for recommendations)."
    )
    major = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Student's major/department (used for recommendations)."
    )
    gpa = models.DecimalField(
        max_digits=3, decimal_places=2, blank=True, null=True,
        help_text="Cumulative GPA on a 4.00 scale (used for recommendations)."
    )

    def __str__(self):
        return f"{self.username} ({self.role})"