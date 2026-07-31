"""
FR-01 -- Login accepts either username or email in the same field.

SimpleJWT's stock TokenObtainPairSerializer only ever authenticates against
Django's USERNAME_FIELD (username). This subclass resolves an email-shaped
identifier to the matching username first, then hands off to the normal
SimpleJWT/Django auth flow untouched -- so password hashing, `is_active`
checks etc. all still go through the same trusted path.
"""
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()


class UsernameOrEmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field, '')

        if '@' in identifier:
            # Look up by email but never reveal whether the email exists --
            # on no match we simply leave the identifier as-is, so it falls
            # through to a normal "no active account" auth failure instead
            # of a different error message that would leak account existence.
            user = User.objects.filter(email__iexact=identifier).first()
            if user is not None:
                attrs[self.username_field] = user.get_username()

        return super().validate(attrs)


class UsernameOrEmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = UsernameOrEmailTokenObtainPairSerializer