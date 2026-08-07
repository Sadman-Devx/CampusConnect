from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/recommendations/', include('recommendations.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/advising/', include('advising.urls')),
    path('api/requests/', include('servicerequests.urls')),
]

# Dev-only: serve uploaded attachments directly. In production these
# should be served by Nginx/S3/etc, not Django.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)