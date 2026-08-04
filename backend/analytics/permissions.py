from rest_framework.permissions import BasePermission

STAFF_ROLES = ('advisor', 'admin')


class IsAdvisorOrAdmin(BasePermission):
    message = "Only advisors or admins can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'role', None) in STAFF_ROLES
        )


class IsSelfOrAssignedAdvisorOrAdmin(BasePermission):
    """
    A student may view their own risk detail. An admin may view anyone's.
    An advisor may only view a student's risk detail if that student is
    actually assigned to them -- being "an advisor" alone is no longer
    enough, closing the gap where any advisor could look up any student's
    GPA/risk score just by knowing their id.
    """
    message = "You may only view your own data, or data for a student assigned to you."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if getattr(request.user, 'role', None) == 'admin':
            return True

        lookup_kwarg = getattr(view, 'student_lookup_kwarg', 'student_id')
        target_id = view.kwargs.get(lookup_kwarg)

        if str(target_id) == str(request.user.id):
            return True

        if getattr(request.user, 'role', None) == 'advisor':
            User = request.user.__class__
            return User.objects.filter(pk=target_id, advisor_id=request.user.id).exists()

        return False