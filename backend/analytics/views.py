from django.contrib.auth import get_user_model
from django.db.models import OuterRef, Subquery
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.serializers import UserSerializer

from .models import AdvisorAlert, RiskScore
from .permissions import IsAdvisorOrAdmin, IsSelfOrAssignedAdvisorOrAdmin
from .serializers import (
    AdvisorAlertSerializer, AdvisorAlertStatusUpdateSerializer,
    RiskScoreHistoryPointSerializer, RiskScoreSerializer,
)
from .services import RiskScoringService
from .ml.predict import RiskModelNotTrainedError

User = get_user_model()
HISTORY_LIMIT = 20


def _model_not_trained_response():
    return Response(
        {"detail": "Risk model is not trained yet. An admin needs to run the training command."},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


class MyRiskScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        latest = RiskScoringService.get_latest_for_student(request.user)
        try:
            if latest is None:
                latest = RiskScoringService.compute_for_student(request.user)
        except RiskModelNotTrainedError:
            return _model_not_trained_response()
        return Response(RiskScoreSerializer(latest).data, status=status.HTTP_200_OK)


class StudentRiskScoreDetailView(APIView):
    permission_classes = [IsSelfOrAssignedAdvisorOrAdmin]
    student_lookup_kwarg = 'student_id'

    def get(self, request, student_id):
        try:
            student = User.objects.get(pk=student_id)
        except User.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        latest = RiskScoringService.get_latest_for_student(student)
        if latest is None:
            try:
                latest = RiskScoringService.compute_for_student(student)
            except RiskModelNotTrainedError:
                return _model_not_trained_response()

        history = RiskScore.objects.filter(student=student).order_by('-computed_at')[:HISTORY_LIMIT]
        return Response({
            # Academic profile alongside the score -- lets the detail view
            # (StudentRiskModal on the frontend) show major/year/GPA and
            # the GPA verification status without a second API call, reusing
            # this endpoint's existing self/assigned-advisor/admin scoping.
            "student": UserSerializer(student).data,
            "current": RiskScoreSerializer(latest).data,
            "history": RiskScoreHistoryPointSerializer(history, many=True).data,
        }, status=status.HTTP_200_OK)


class RiskScoreListView(ListAPIView):
    serializer_class = RiskScoreSerializer
    permission_classes = [IsAdvisorOrAdmin]

    def get_queryset(self):
        latest_per_student = (
            RiskScore.objects.filter(student=OuterRef('student'))
            .order_by('-computed_at').values('id')[:1]
        )
        queryset = RiskScore.objects.filter(id=Subquery(latest_per_student)).select_related('student')

        # Privacy scoping: an advisor only sees their own assigned students'
        # scores. Admins retain full oversight visibility.
        if self.request.user.role == 'advisor':
            queryset = queryset.filter(student__advisor_id=self.request.user.id)

        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)
        return queryset.order_by('-score')


class ComputeRiskScoresView(APIView):
    permission_classes = [IsAdvisorOrAdmin]

    def post(self, request):
        student_id = request.data.get('student_id')
        try:
            if student_id:
                try:
                    student = User.objects.get(pk=student_id, role='student')
                except User.DoesNotExist:
                    return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
                if request.user.role == 'advisor' and student.advisor_id != request.user.id:
                    return Response(
                        {"detail": "You can only recompute scores for students assigned to you."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                results = [RiskScoringService.compute_for_student(student)]
            else:
                students = User.objects.filter(role='student')
                if request.user.role == 'advisor':
                    students = students.filter(advisor_id=request.user.id)
                results = RiskScoringService.compute_for_students(students)
        except RiskModelNotTrainedError:
            return _model_not_trained_response()

        return Response({"computed_count": len(results), "computed_at": timezone.now()}, status=status.HTTP_200_OK)


class AdvisorAlertListView(ListAPIView):
    serializer_class = AdvisorAlertSerializer
    permission_classes = [IsAdvisorOrAdmin]

    def get_queryset(self):
        queryset = AdvisorAlert.objects.select_related('student', 'risk_score', 'acknowledged_by')

        # Privacy scoping: an advisor only sees alerts for their own
        # assigned students. Admins retain full oversight visibility.
        if self.request.user.role == 'advisor':
            queryset = queryset.filter(student__advisor_id=self.request.user.id)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        return queryset.order_by('-created_at')


class AdvisorAlertDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsAdvisorOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return AdvisorAlertStatusUpdateSerializer
        return AdvisorAlertSerializer

    def get_queryset(self):
        # Scoping the queryset (rather than an object-level permission check)
        # means an advisor requesting another advisor's student's alert gets
        # a plain 404, not a 403 -- it doesn't confirm the alert even exists.
        queryset = AdvisorAlert.objects.select_related('student', 'risk_score', 'acknowledged_by')
        if self.request.user.role == 'advisor':
            queryset = queryset.filter(student__advisor_id=self.request.user.id)
        return queryset

    def perform_update(self, serializer):
        new_status = serializer.validated_data.get('status')
        extra = {}
        if new_status == AdvisorAlert.STATUS_ACKNOWLEDGED:
            extra['acknowledged_by'] = self.request.user
            extra['acknowledged_at'] = timezone.now()
        elif new_status == AdvisorAlert.STATUS_RESOLVED:
            extra['resolved_at'] = timezone.now()
        serializer.save(**extra)