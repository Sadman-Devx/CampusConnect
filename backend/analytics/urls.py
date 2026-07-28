from django.urls import path
from .views import (
    AdvisorAlertDetailView, AdvisorAlertListView, ComputeRiskScoresView,
    MyRiskScoreView, RiskScoreListView, StudentRiskScoreDetailView,
)

urlpatterns = [
    path('risk-score/me/', MyRiskScoreView.as_view(), name='my-risk-score'),
    path('risk-score/<int:student_id>/', StudentRiskScoreDetailView.as_view(), name='student-risk-score'),
    path('risk-scores/', RiskScoreListView.as_view(), name='risk-score-list'),
    path('compute/', ComputeRiskScoresView.as_view(), name='compute-risk-scores'),
    path('alerts/', AdvisorAlertListView.as_view(), name='advisor-alert-list'),
    path('alerts/<int:pk>/', AdvisorAlertDetailView.as_view(), name='advisor-alert-detail'),
]