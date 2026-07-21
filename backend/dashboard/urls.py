from django.urls import path
from .views import DashboardView, NavigationLogView

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('log/', NavigationLogView.as_view(), name='navigation-log'),
]