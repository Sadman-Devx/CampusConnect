from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .auth_serializers import UsernameOrEmailTokenObtainPairView
from .views import (
    RegisterView, MeView, AvatarUploadView, VerifyStudentGpaView,
    PasswordResetRequestView, PasswordResetConfirmView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', UsernameOrEmailTokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='login_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('me/avatar/', AvatarUploadView.as_view(), name='avatar-upload'),
    path('students/<int:student_id>/verify-gpa/', VerifyStudentGpaView.as_view(), name='verify-student-gpa'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]