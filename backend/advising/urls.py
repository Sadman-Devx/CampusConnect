from django.urls import path
from .views import (
    AdvisorListView, OpenSlotListView,
    MySlotListCreateView, MySlotDetailView,
    MyBookingListCreateView, CancelBookingView,
    PendingBookingListView, DecideBookingView,
)

urlpatterns = [
    # Student-facing browse
    path('advisors/', AdvisorListView.as_view(), name='advisor-list'),
    path('slots/open/', OpenSlotListView.as_view(), name='open-slot-list'),

    # Advisor-facing slot management
    path('slots/mine/', MySlotListCreateView.as_view(), name='my-slot-list-create'),
    path('slots/mine/<int:pk>/', MySlotDetailView.as_view(), name='my-slot-detail'),

    # Student-facing booking
    path('bookings/mine/', MyBookingListCreateView.as_view(), name='my-booking-list-create'),
    path('bookings/mine/<int:pk>/cancel/', CancelBookingView.as_view(), name='cancel-booking'),

    # Advisor-facing booking decisions
    path('bookings/pending/', PendingBookingListView.as_view(), name='pending-booking-list'),
    path('bookings/<int:pk>/decide/', DecideBookingView.as_view(), name='decide-booking'),
]