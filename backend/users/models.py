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

    # Django's AbstractUser.email is NOT unique by default -- only the
    # serializer-level check enforced this before. Enforcing it at the
    # database level too closes a race-condition/consistency gap so a
    # single email can never back two accounts (and therefore never two
    # different roles).
    email = models.EmailField(unique=True, blank=True)

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
    # Self-reported by the student on ProfilePage, with no verification --
    # an advisor deciding whether to approve a booking, or seeing this on
    # a risk-score detail view, was trusting an unverified number. This
    # pair of fields lets an assigned advisor/admin confirm it against an
    # official record. Cleared automatically the moment the student edits
    # their academic info again (see ProfileUpdateSerializer.update), so a
    # "verified" badge never survives a silent change underneath it.
    gpa_verified_by = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='gpa_verifications',
        limit_choices_to={'role__in': ['advisor', 'admin']},
        help_text="Advisor/admin who last confirmed this student's self-reported GPA.",
    )
    gpa_verified_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the GPA above was last confirmed. Cleared automatically if the student edits their academic info.",
    )

    # A student's assigned primary advisor. This gates who can see this
    # student's risk-score/at-risk data (privacy-sensitive) -- it does NOT
    # restrict which advisor a student can book an appointment with, since
    # a student may legitimately want to meet an advisor other than their
    # assigned one (e.g. for a second opinion, or if their advisor has no
    # open slots). SET_NULL on delete so removing an advisor account never
    # cascades into deleting student records.
    advisor = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_students',
        limit_choices_to={'role': 'advisor'},
        help_text="The student's assigned advisor. Only this advisor (plus admins) can see the student's risk/analytics data.",
    )

    def __str__(self):
        return f"{self.username} ({self.role})"