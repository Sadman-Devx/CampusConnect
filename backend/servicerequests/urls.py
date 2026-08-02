from django.urls import path
from .views import MyRequestListCreateView, StaffRequestListView, UpdateRequestStatusView

urlpatterns = [
    path('mine/', MyRequestListCreateView.as_view(), name='my-service-requests'),
    path('staff/', StaffRequestListView.as_view(), name='staff-service-requests'),
    path('<int:pk>/update/', UpdateRequestStatusView.as_view(), name='update-service-request'),
]