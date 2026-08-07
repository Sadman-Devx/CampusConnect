from datetime import timedelta
from django.utils import timezone
from dashboard.models import NavigationLog, CourseEnrollment, EventRSVP, ScholarshipApplication
from advising.models import AppointmentBooking
from servicerequests.models import ServiceRequest

DEFAULT_GPA = 2.75
ENGAGEMENT_WINDOW_DAYS = 30
NO_ACTIVITY_DAYS = 120.0

_ACADEMIC_YEAR_PROGRESS = {
    'Freshman': 1, 'Sophomore': 2, 'Junior': 3, 'Senior': 4, 'Graduate': 5,
}


def build_features_for_student(user) -> dict:
    """
    Real actions the student takes across the whole app feed into these
    features -- not just dashboard-widget navigation clicks.

    Previously engagement_score/advising_engagement/days_since_last_active
    only counted NavigationLog rows, which are created solely when a
    student clicks one of the four "Quick access" catalog cards at the
    bottom of the dashboard. A student who actually booked and attended
    advising meetings, registered for courses, or submitted service
    requests -- but never happened to click those specific catalog cards
    -- looked exactly as inactive as someone who never logged in, which is
    why the engagement score could sit at 0 despite real activity.
    """
    now = timezone.now()
    window_start = now - timedelta(days=ENGAGEMENT_WINDOW_DAYS)

    logs = NavigationLog.objects.filter(user=user)
    nav_clicks_recent = logs.filter(clicked_at__gte=window_start).count()

    # Real advising contact: appointments the student has requested or had
    # approved, not just a click on the advising catalog card.
    advising_bookings = AppointmentBooking.objects.filter(student=user)
    advising_engagement = advising_bookings.filter(requested_at__gte=window_start).count()

    course_enrollments_recent = CourseEnrollment.objects.filter(
        student=user, enrolled_at__gte=window_start
    ).count()
    service_requests_recent = ServiceRequest.objects.filter(
        student=user, created_at__gte=window_start
    ).count()
    event_rsvps_recent = EventRSVP.objects.filter(student=user, rsvp_at__gte=window_start).count()
    scholarship_apps_recent = ScholarshipApplication.objects.filter(
        student=user, applied_at__gte=window_start
    ).count()

    engagement_score = float(
        nav_clicks_recent
        + advising_engagement
        + course_enrollments_recent
        + service_requests_recent
        + event_rsvps_recent
        + scholarship_apps_recent
    )

    # "Last active" across every real action, not just dashboard navigation.
    activity_timestamps = [
        logs.order_by('-clicked_at').values_list('clicked_at', flat=True).first(),
        advising_bookings.order_by('-requested_at').values_list('requested_at', flat=True).first(),
        CourseEnrollment.objects.filter(student=user).order_by('-enrolled_at').values_list('enrolled_at', flat=True).first(),
        ServiceRequest.objects.filter(student=user).order_by('-created_at').values_list('created_at', flat=True).first(),
        EventRSVP.objects.filter(student=user).order_by('-rsvp_at').values_list('rsvp_at', flat=True).first(),
        ScholarshipApplication.objects.filter(student=user).order_by('-applied_at').values_list('applied_at', flat=True).first(),
    ]
    last_active = max((t for t in activity_timestamps if t is not None), default=None)

    if last_active is None:
        days_since_last_active = NO_ACTIVITY_DAYS
    else:
        days_since_last_active = min((now - last_active).total_seconds() / 86400.0, NO_ACTIVITY_DAYS)

    gpa = float(user.gpa) if user.gpa is not None else DEFAULT_GPA
    academic_year_progress = _ACADEMIC_YEAR_PROGRESS.get(user.academic_year, 1)

    return {
        'gpa': round(gpa, 2),
        'academic_year_progress': academic_year_progress,
        'engagement_score': engagement_score,
        'days_since_last_active': round(days_since_last_active, 1),
        'advising_engagement': float(advising_engagement),
    }