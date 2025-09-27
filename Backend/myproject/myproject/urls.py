# urls.py (main project urls)
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('myapp.urls')),
    path('api-auth/', include('rest_framework.urls')),  
]

# Serve media and static files
if settings.DEBUG:
    # Serve main media directory
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve uploads directory
    urlpatterns += static(settings.UPLOADS_URL, document_root=settings.UPLOADS_ROOT)
    # Serve safety guides directory
    urlpatterns += static(settings.SAFETY_GUIDES_URL, document_root=settings.SAFETY_GUIDES_ROOT)
    # Serve static files
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)