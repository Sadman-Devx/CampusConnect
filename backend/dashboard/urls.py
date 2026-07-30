from django.urls import path
from .views import (
    AdminDashboardView, DashboardView, NavigationLogView,
    FinancialAidItemListCreateView, FinancialAidItemDetailView,
    EventItemListCreateView, EventItemDetailView,
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
]