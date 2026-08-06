from rest_framework.permissions import BasePermission


class IsAdminOnly(BasePermission):
    """
    Institution-wide resources (scholarships, events, courses) should only be
    managed by admin — advisors are scoped to individual student advising,
    not global data that affects every student in the system.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsStudentRole(BasePermission):
    """Enrollment/application/RSVP actions are student-only."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "student")