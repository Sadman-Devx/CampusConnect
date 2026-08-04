from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdvisorRole(BasePermission):
    """Only advisor accounts can create/manage availability slots."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "advisor")


class IsAdminRole(BasePermission):
    """Only admin accounts can assign students to advisors."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsStudentRole(BasePermission):
    """Only student accounts can browse slots and request bookings."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "student")


class IsOwnerAdvisor(BasePermission):
    """
    Object-level check for AdvisorAvailability -- an advisor may only
    read/update/delete their *own* slots, never another advisor's.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.advisor_id == request.user.id
        return obj.advisor_id == request.user.id