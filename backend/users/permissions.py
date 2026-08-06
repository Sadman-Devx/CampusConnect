from rest_framework.permissions import BasePermission


class IsAssignedAdvisorOrAdmin(BasePermission):
    """Only this student's assigned advisor, or an admin, may verify
    their GPA -- same scoping analytics uses for risk data, so an advisor
    can't reach into a student who isn't theirs."""
    message = "You may only verify GPA for a student assigned to you."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("advisor", "admin")
        )

    def has_object_permission(self, request, view, student):
        if request.user.role == "admin":
            return True
        return student.advisor_id == request.user.id