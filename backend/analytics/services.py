from django.db import transaction
from .alerts import evaluate_and_create_alerts
from .features import build_features_for_student
from .ml.predict import predict_risk
from .models import RiskScore


class RiskScoringService:

    @staticmethod
    @transaction.atomic
    def compute_for_student(user) -> RiskScore:
        previous_score = RiskScore.objects.filter(student=user).order_by('-computed_at').first()
        features = build_features_for_student(user)
        result = predict_risk(features)

        risk_score = RiskScore.objects.create(
            student=user, probability=result['probability'], score=result['score'],
            risk_level=result['risk_level'], features=features,
            top_factors=result['top_factors'], model_version=result['model_version'],
        )
        evaluate_and_create_alerts(risk_score, previous_score=previous_score)
        return risk_score

    @staticmethod
    def compute_for_students(users) -> list:
        return [RiskScoringService.compute_for_student(user) for user in users]

    @staticmethod
    def get_latest_for_student(user):
        return RiskScore.objects.filter(student=user).order_by('-computed_at').first()