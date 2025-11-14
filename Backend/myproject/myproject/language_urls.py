from django.urls import path
from myapp.language_views import set_language, get_current_language, get_translations

urlpatterns = [
    path('api/language/set/', set_language, name='set_language'),
    path('api/language/current/', get_current_language, name='get_current_language'),
    path('api/language/translations/', get_translations, name='get_translations'),
]