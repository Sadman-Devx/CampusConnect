from rest_framework.permissions import BasePermission


class IsStaffRole(BasePermission):
    """Advisor or admin -- chatbot-escalated tickets aren't tied to one
    specific staff member, so any staff member can pick one up (same
    reasoning as servicerequests.IsStaffRole)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ("advisor", "admin"))