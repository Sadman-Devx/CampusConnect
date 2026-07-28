from rest_framework.permissions import BasePermission

STAFF_ROLES = ('advisor', 'admin')


class IsAdvisorOrAdmin(BasePermission):
    message = "Only advisors or admins can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'role', None) in STAFF_ROLES
        )


class IsSelfOrAdvisorOrAdmin(BasePermission):
    message = "You may only view your own data unless you are an advisor or admin."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if getattr(request.user, 'role', None) in STAFF_ROLES:
            return True
        lookup_kwarg = getattr(view, 'student_lookup_kwarg', 'student_id')
        target_id = view.kwargs.get(lookup_kwarg)
        return str(target_id) == str(request.user.id)