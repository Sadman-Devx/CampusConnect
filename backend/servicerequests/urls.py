from django.urls import path
from .views import (
    MyRequestListCreateView, StaffRequestListView, UpdateRequestStatusView,
    ClaimRequestView, ReleaseRequestView,
    RequestAttachmentUploadView, RequestCommentCreateView,
)

urlpatterns = [
    path('mine/', MyRequestListCreateView.as_view(), name='my-service-requests'),
    path('staff/', StaffRequestListView.as_view(), name='staff-service-requests'),
    path('<int:pk>/update/', UpdateRequestStatusView.as_view(), name='update-service-request'),
    path('<int:pk>/claim/', ClaimRequestView.as_view(), name='claim-service-request'),
    path('<int:pk>/release/', ReleaseRequestView.as_view(), name='release-service-request'),
    path('<int:pk>/attachments/', RequestAttachmentUploadView.as_view(), name='service-request-attachment-upload'),
    path('<int:pk>/comments/', RequestCommentCreateView.as_view(), name='service-request-comment-create'),
]