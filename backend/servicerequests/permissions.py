from rest_framework.permissions import BasePermission


class IsStudentRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "student")


class IsStaffRole(BasePermission):
    """Advisor or admin -- service requests aren't tied to one specific
    advisor the way appointment slots are, so any staff member can pick
    one up (matches the DFD's generic "Staff Reviews & Updates Status")."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ("advisor", "admin"))