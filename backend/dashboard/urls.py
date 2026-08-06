from django.urls import path
from .views import (
    AdminDashboardView, DashboardView, NavigationLogView,
    FinancialAidItemListCreateView, FinancialAidItemDetailView,
    EventItemListCreateView, EventItemDetailView,
    EnrollCourseView, DropCourseView, MyEnrollmentsView,
    ApplyScholarshipView, MyApplicationsView,
    RSVPEventView, MyRSVPsView,
)

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('log/', NavigationLogView.as_view(), name='navigation-log'),
    path('admin/', AdminDashboardView.as_view(), name='admin-dashboard'),

    # Manage opportunities (advisor/admin only)
    path('manage/financial-aid/', FinancialAidItemListCreateView.as_view(), name='manage-financial-aid-list'),
    path('manage/financial-aid/<int:pk>/', FinancialAidItemDetailView.as_view(), name='manage-financial-aid-detail'),
    path('manage/events/', EventItemListCreateView.as_view(), name='manage-events-list'),
    path('manage/events/<int:pk>/', EventItemDetailView.as_view(), name='manage-events-detail'),

    # Real course enrollment (student-facing)
    path('registration/<int:pk>/enroll/', EnrollCourseView.as_view(), name='enroll-course'),
    path('registration/<int:pk>/drop/', DropCourseView.as_view(), name='drop-course'),
    path('registration/mine/', MyEnrollmentsView.as_view(), name='my-enrollments'),

    # Real scholarship applications (student-facing)
    path('financial-aid/<int:pk>/apply/', ApplyScholarshipView.as_view(), name='apply-scholarship'),
    path('financial-aid/mine/', MyApplicationsView.as_view(), name='my-applications'),

    # Real event RSVPs (student-facing)
    path('events/<int:pk>/rsvp/', RSVPEventView.as_view(), name='rsvp-event'),
    path('events/mine/', MyRSVPsView.as_view(), name='my-rsvps'),
]