from datetime import timedelta
from django.utils import timezone
from dashboard.models import NavigationLog

DEFAULT_GPA = 2.75
ENGAGEMENT_WINDOW_DAYS = 30
NO_ACTIVITY_DAYS = 120.0

_ACADEMIC_YEAR_PROGRESS = {
    'Freshman': 1, 'Sophomore': 2, 'Junior': 3, 'Senior': 4, 'Graduate': 5,
}


def build_features_for_student(user) -> dict:
    now = timezone.now()
    window_start = now - timedelta(days=ENGAGEMENT_WINDOW_DAYS)

    logs = NavigationLog.objects.filter(user=user)
    engagement_score = float(logs.filter(clicked_at__gte=window_start).count())
    advising_engagement = logs.filter(widget='advising', clicked_at__gte=window_start).count()

    last_log = logs.order_by('-clicked_at').first()
    if last_log is None:
        days_since_last_active = NO_ACTIVITY_DAYS
    else:
        days_since_last_active = min((now - last_log.clicked_at).total_seconds() / 86400.0, NO_ACTIVITY_DAYS)

    gpa = float(user.gpa) if user.gpa is not None else DEFAULT_GPA
    academic_year_progress = _ACADEMIC_YEAR_PROGRESS.get(user.academic_year, 1)

    return {
        'gpa': round(gpa, 2),
        'academic_year_progress': academic_year_progress,
        'engagement_score': engagement_score,
        'days_since_last_active': round(days_since_last_active, 1),
        'advising_engagement': float(advising_engagement),
    }