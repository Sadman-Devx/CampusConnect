from django.contrib.auth import get_user_model
from django.db.models import OuterRef, Subquery
from analytics.models import AdvisorAlert, RiskScore
from analytics.permissions import IsAdvisorOrAdmin
from analytics.serializers import AdvisorAlertSerializer, RiskScoreSerializer

User = get_user_model()
TOP_AT_RISK_LIMIT = 5
RECENT_ALERTS_LIMIT = 5


from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import AdvisingItem, FinancialAidItem, RegistrationItem, EventItem
from .serializers import (
    AdvisingItemSerializer, FinancialAidItemSerializer,
    RegistrationItemSerializer, EventItemSerializer, NavigationLogSerializer
)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            "advising": AdvisingItemSerializer(AdvisingItem.objects.all(), many=True).data,
            "financial_aid": FinancialAidItemSerializer(FinancialAidItem.objects.all(), many=True).data,
            "registration": RegistrationItemSerializer(RegistrationItem.objects.all(), many=True).data,
            "events": EventItemSerializer(EventItem.objects.all(), many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)


class NavigationLogView(generics.CreateAPIView):
    serializer_class = NavigationLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AdminDashboardView(APIView):
    """FR-07 -- GET /api/dashboard/admin/ (advisor/admin only)"""
    permission_classes = [IsAdvisorOrAdmin]

    def get(self, request):
        total_students = User.objects.filter(role='student').count()

        latest_per_student = (
            RiskScore.objects.filter(student=OuterRef('student'))
            .order_by('-computed_at').values('id')[:1]
        )
        latest_scores = RiskScore.objects.filter(id=Subquery(latest_per_student)).select_related('student')

        risk_distribution = {'low': 0, 'medium': 0, 'high': 0}
        for level in latest_scores.values_list('risk_level', flat=True):
            if level in risk_distribution:
                risk_distribution[level] += 1

        top_at_risk = latest_scores.order_by('-score')[:TOP_AT_RISK_LIMIT]
        recent_alerts = AdvisorAlert.objects.select_related('student', 'risk_score').order_by('-created_at')[:RECENT_ALERTS_LIMIT]
        open_alerts_count = AdvisorAlert.objects.filter(status=AdvisorAlert.STATUS_OPEN).count()

        data = {
            "total_students": total_students,
            "students_scored": latest_scores.count(),
            "risk_distribution": risk_distribution,
            "open_alerts_count": open_alerts_count,
            "top_at_risk_students": RiskScoreSerializer(top_at_risk, many=True).data,
            "recent_alerts": AdvisorAlertSerializer(recent_alerts, many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)
