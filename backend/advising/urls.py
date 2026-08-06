from django.urls import path
from .views import (
    MyAdvisorProfileView,
    AdvisorListView, OpenSlotListView,
    MySlotListCreateView, MySlotDetailView,
    MyRecurringRuleListCreateView, MyRecurringRuleDetailView,
    MyBookingListCreateView, CancelBookingView,
    PendingBookingListView, DecideBookingView, PendingBookingCountView,
    ProposeRescheduleView, RespondRescheduleView,
    StudentAssignmentListView, AssignAdvisorView,
)

urlpatterns = [
    # Admin-facing advisor<->student assignment
    path('assignments/', StudentAssignmentListView.as_view(), name='student-assignment-list'),
    path('assignments/<int:student_id>/', AssignAdvisorView.as_view(), name='assign-advisor'),

    # Advisor-facing profile
    path('profile/mine/', MyAdvisorProfileView.as_view(), name='my-advisor-profile'),

    # Student-facing browse
    path('advisors/', AdvisorListView.as_view(), name='advisor-list'),
    path('slots/open/', OpenSlotListView.as_view(), name='open-slot-list'),

    # Advisor-facing slot management
    path('slots/mine/', MySlotListCreateView.as_view(), name='my-slot-list-create'),
    path('slots/mine/<int:pk>/', MySlotDetailView.as_view(), name='my-slot-detail'),
    path('slots/mine/recurring/', MyRecurringRuleListCreateView.as_view(), name='my-recurring-rule-list-create'),
    path('slots/mine/recurring/<int:pk>/', MyRecurringRuleDetailView.as_view(), name='my-recurring-rule-detail'),

    # Student-facing booking
    path('bookings/mine/', MyBookingListCreateView.as_view(), name='my-booking-list-create'),
    path('bookings/mine/<int:pk>/cancel/', CancelBookingView.as_view(), name='cancel-booking'),
    path('bookings/mine/<int:pk>/reschedule/respond/', RespondRescheduleView.as_view(), name='respond-reschedule'),

    # Advisor-facing booking decisions
    path('bookings/pending/', PendingBookingListView.as_view(), name='pending-booking-list'),
    path('bookings/pending/count/', PendingBookingCountView.as_view(), name='pending-booking-count'),
    path('bookings/<int:pk>/decide/', DecideBookingView.as_view(), name='decide-booking'),
    path('bookings/<int:pk>/propose-reschedule/', ProposeRescheduleView.as_view(), name='propose-reschedule'),
]