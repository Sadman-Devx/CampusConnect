from django.contrib import admin
from .models import AdvisorAlert, RiskScore


@admin.register(RiskScore)
class RiskScoreAdmin(admin.ModelAdmin):
    list_display = ('student', 'score', 'risk_level', 'model_version', 'computed_at')
    list_filter = ('risk_level', 'model_version')
    search_fields = ('student__username', 'student__student_id')
    ordering = ('-computed_at',)


@admin.register(AdvisorAlert)
class AdvisorAlertAdmin(admin.ModelAdmin):
    list_display = ('student', 'severity', 'status', 'reason', 'created_at')
    list_filter = ('severity', 'status')
    search_fields = ('student__username', 'reason')
    ordering = ('-created_at',)