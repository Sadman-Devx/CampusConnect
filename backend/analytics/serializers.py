from rest_framework import serializers
from .models import AdvisorAlert, RiskScore


class RiskScoreSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = RiskScore
        fields = [
            'id', 'student_id', 'student_username', 'probability', 'score',
            'risk_level', 'features', 'top_factors', 'model_version', 'computed_at',
        ]
        read_only_fields = fields


class RiskScoreHistoryPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskScore
        fields = ['score', 'risk_level', 'computed_at']
        read_only_fields = fields


class AdvisorAlertSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    risk_score_value = serializers.FloatField(source='risk_score.score', read_only=True)
    acknowledged_by_username = serializers.CharField(source='acknowledged_by.username', read_only=True, default=None)

    class Meta:
        model = AdvisorAlert
        fields = [
            'id', 'student_id', 'student_username', 'risk_score_value',
            'severity', 'reason', 'status', 'created_at',
            'acknowledged_by_username', 'acknowledged_at', 'resolved_at',
        ]
        read_only_fields = [
            'id', 'student_id', 'student_username', 'risk_score_value',
            'severity', 'reason', 'created_at', 'acknowledged_by_username',
            'acknowledged_at', 'resolved_at',
        ]


class AdvisorAlertStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvisorAlert
        fields = ['status']

    def validate_status(self, value):
        valid = {choice for choice, _ in AdvisorAlert.STATUS_CHOICES}
        if value not in valid:
            raise serializers.ValidationError(f"status must be one of {sorted(valid)}.")
        return value