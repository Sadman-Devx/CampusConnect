from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# Admin accounts must never be self-service -- they're created via Django's
# createsuperuser / admin panel / a controlled seed process only. Public
# registration may only hand out these two roles.
PUBLIC_REGISTRATION_ROLES = ('student', 'advisor')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=PUBLIC_REGISTRATION_ROLES, default='student')
    # Declared explicitly (instead of letting ModelSerializer infer it) so DRF's
    # auto-generated UniqueValidator doesn't run -- we handle the uniqueness
    # check ourselves in validate_email() with a case-insensitive comparison
    # and a consistent, friendly error message.
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'student_id', 'role']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists. Please log in.")
        return value

    def validate(self, attrs):
        # Student ID only makes sense for the student role -- an advisor
        # account shouldn't carry one, so silently drop it rather than
        # storing misleading data.
        if attrs.get('role') == 'advisor':
            attrs['student_id'] = None
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            student_id=validated_data.get('student_id'),
            role=validated_data.get('role', 'student'),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'student_id', 'role', 'is_verified',
            'academic_year', 'major', 'gpa',
        ]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Restricted serializer used by students to fill in the academic profile
    (major / academic_year / gpa) that powers the FR-04 recommendation
    engine. Does not allow changing role, username or verification status.
    """
    class Meta:
        model = User
        fields = ['academic_year', 'major', 'gpa']

    def validate_gpa(self, value):
        if value is not None and not (0 <= value <= 4):
            raise serializers.ValidationError("GPA must be between 0.00 and 4.00.")
        return value