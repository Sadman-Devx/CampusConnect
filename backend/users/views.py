from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser   # notun line
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAssignedAdvisorOrAdmin
from .serializers import (
    RegisterSerializer, UserSerializer, ProfileUpdateSerializer, AvatarUploadSerializer,  # AvatarUploadSerializer add
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
"user": UserSerializer(user, context={"request": request}).data,
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={"request": request}).data, status=status.HTTP_200_OK)


class AvatarUploadView(APIView):
    """Student uploads/replaces their own profile photo. Kept as a separate
    multipart endpoint (rather than folded into MeView.patch) because the
    rest of the profile form is submitted as JSON -- same separation the
    servicerequests app uses between updating a request and attaching a
    file to it."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.avatar = serializer.validated_data["avatar"]
        request.user.save(update_fields=["avatar"])
        return Response(UserSerializer(request.user, context={"request": request}).data, status=status.HTTP_200_OK)


class VerifyStudentGpaView(APIView):
    """
    Advisor (of this student) or admin confirms the student's self-reported
    GPA matches an official record. This is a point-in-time signal, not a
    lock -- it's cleared automatically the moment the student edits their
    academic info again, so a verified badge always reflects the number
    currently on screen.
    """
    permission_classes = [IsAuthenticated, IsAssignedAdvisorOrAdmin]

    def post(self, request, student_id):
        student = User.objects.filter(pk=student_id, role="student").first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, student)

        if student.gpa is None:
            return Response({"detail": "This student hasn't entered a GPA yet."}, status=status.HTTP_400_BAD_REQUEST)

        student.gpa_verified_at = timezone.now()
        student.gpa_verified_by = request.user
        student.save(update_fields=["gpa_verified_at", "gpa_verified_by"])
        return Response(UserSerializer(student, context={"request": request}).data)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            send_mail(
                subject="Reset your CampusConnect password",
                message=(
                    f"Hi {user.username},\n\n"
                    f"Click the link below to reset your password:\n{reset_link}\n\n"
                    f"If you didn't request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )

        return Response(
            {"detail": "If an account with that email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)