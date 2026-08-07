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

    # Profile-completeness fields (ProfilePage). Separate from `major`,
    # `academic_year` and `gpa` above -- those feed the FR-04 recommendation
    # engine and are matched against exact eligibility strings (e.g.
    # "Computer Science"), while these are purely descriptive/contact info
    # for the student's own profile card. All nullable/optional: a student
    # shouldn't be locked out of the app for not filling these in, and some
    # (date_of_birth, gender, blood_group) are sensitive enough that many
    # students will legitimately choose not to share them.
    full_name = models.CharField(
        max_length=150, blank=True,
        help_text="Student's real/display name -- distinct from the login username.",
    )
    phone_number = models.CharField(max_length=20, blank=True)
    # Full degree/program title, e.g. "B.Sc. in Software Engineering" --
    # kept separate from `major` (which the recommendation engine matches
    # against scholarship/event eligible_majors lists like "Computer
    # Science") since the two serve different purposes and granularities.
    program = models.CharField(max_length=150, blank=True, null=True)
    campus = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Short campus/location label, e.g. 'DSC'.",
    )
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=30, blank=True, null=True)

    BLOOD_GROUP_CHOICES = (
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    )
    blood_group = models.CharField(
        max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True, null=True,
    )
    avatar = models.FileField(upload_to="avatars/%Y/%m/", blank=True, null=True)# Profile-completeness fields (ProfilePage). Separate from `major`,
    # `academic_year` and `gpa` above -- those feed the FR-04 recommendation
    # engine and are matched against exact eligibility strings (e.g.
    # "Computer Science"), while these are purely descriptive/contact info
    # for the student's own profile card. All nullable/optional: a student
    # shouldn't be locked out of the app for not filling these in, and some
    # (date_of_birth, gender, blood_group) are sensitive enough that many
    # students will legitimately choose not to share them.
    full_name = models.CharField(
        max_length=150, blank=True,
        help_text="Student's real/display name -- distinct from the login username.",
    )
    phone_number = models.CharField(max_length=20, blank=True)
    # Full degree/program title, e.g. "B.Sc. in Software Engineering" --
    # kept separate from `major` (which the recommendation engine matches
    # against scholarship/event eligible_majors lists like "Computer
    # Science") since the two serve different purposes and granularities.
    program = models.CharField(max_length=150, blank=True, null=True)
    campus = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Short campus/location label, e.g. 'DSC'.",
    )
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=30, blank=True, null=True)

    BLOOD_GROUP_CHOICES = (
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    )
    blood_group = models.CharField(
        max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True, null=True,
    )
    avatar = models.FileField(upload_to="avatars/%Y/%m/", blank=True, null=True)

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