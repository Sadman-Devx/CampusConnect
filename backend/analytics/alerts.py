from datetime import timedelta
from django.utils import timezone
from .models import AdvisorAlert

SHARP_INCREASE_THRESHOLD = 15.0
DEDUPE_WINDOW_DAYS = 3
_LEVEL_RANK = {'low': 0, 'medium': 1, 'high': 2}


def _has_recent_open_alert(student, reason_prefix: str) -> bool:
    cutoff = timezone.now() - timedelta(days=DEDUPE_WINDOW_DAYS)
    return AdvisorAlert.objects.filter(
        student=student, status=AdvisorAlert.STATUS_OPEN,
        reason__startswith=reason_prefix, created_at__gte=cutoff,
    ).exists()


def evaluate_and_create_alerts(risk_score, previous_score=None):
    student = risk_score.student
    created = []

    if risk_score.risk_level == 'high':
        reason_prefix = "High risk:"
        if not _has_recent_open_alert(student, reason_prefix):
            created.append(AdvisorAlert.objects.create(
                student=student, risk_score=risk_score,
                severity=AdvisorAlert.SEVERITY_CRITICAL,
                reason=f"{reason_prefix} score {risk_score.score:.0f}/100",
            ))
        return created

    if previous_score is not None:
        prev_rank = _LEVEL_RANK.get(previous_score.risk_level, 0)
        curr_rank = _LEVEL_RANK.get(risk_score.risk_level, 0)

        if curr_rank > prev_rank:
            reason_prefix = "Risk escalated:"
            if not _has_recent_open_alert(student, reason_prefix):
                created.append(AdvisorAlert.objects.create(
                    student=student, risk_score=risk_score,
                    severity=AdvisorAlert.SEVERITY_WARNING,
                    reason=f"{reason_prefix} {previous_score.risk_level} -> {risk_score.risk_level}",
                ))
            return created

        delta = risk_score.score - previous_score.score
        if delta >= SHARP_INCREASE_THRESHOLD:
            reason_prefix = "Sharp increase:"
            if not _has_recent_open_alert(student, reason_prefix):
                created.append(AdvisorAlert.objects.create(
                    student=student, risk_score=risk_score,
                    severity=AdvisorAlert.SEVERITY_WARNING,
                    reason=f"{reason_prefix} +{delta:.0f} pts since last check",
                ))

    return created