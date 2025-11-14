# myapp/language_views.py
# Updated language switching API views

from django.http import JsonResponse
from django.utils.translation import activate, get_language
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json


SUPPORTED_LANGUAGES = ["en", "fr", "rw"]


@require_http_methods(["POST"])
@csrf_exempt   # keep this ON because you're using fetch() without CSRF
def set_language(request):
    """
    Set the user's preferred language via API.
    Works with React fetch() using credentials: "include".
    """

    try:
        body = request.body.decode("utf-8").strip()

        if not body:
            return JsonResponse({
                "status": "error",
                "message": "Request body is empty"
            }, status=400)

        data = json.loads(body)
        lang = data.get("language", "").lower()

        if lang not in SUPPORTED_LANGUAGES:
            return JsonResponse({
                "status": "error",
                "message": f"Invalid language '{lang}'. Allowed: {SUPPORTED_LANGUAGES}"
            }, status=400)

        # Activate for this request
        activate(lang)

        # Store in session (optional)
        if request.session is not None:
            request.session["django_language"] = lang

        # Prepare response
        response = JsonResponse({
            "status": "success",
            "language": lang,
            "message": "Language set successfully"
        })

        # Set cookie for 1 year
        response.set_cookie(
            key="django_language",
            value=lang,
            max_age=365 * 24 * 60 * 60,
            httponly=False,      # allows JS to read if needed
            secure=False,        # set to True in production HTTPS
            samesite="Lax",      # prevents CSRF issues
        )

        return response

    except json.JSONDecodeError:
        return JsonResponse({
            "status": "error",
            "message": "Invalid JSON format"
        }, status=400)

    except Exception as exc:
        return JsonResponse({
            "status": "error",
            "message": str(exc)
        }, status=500)


@require_http_methods(["GET"])
def get_current_language(request):
    """Return the current language and list of supported languages."""

    return JsonResponse({
        "language": get_language(),
        "available_languages": [
            {"code": "en", "name": "English"},
            {"code": "fr", "name": "French"},
            {"code": "rw", "name": "Kinyarwanda"},
        ]
    })


@require_http_methods(["GET"])
def get_translations(request):
    """
    Return translation strings for frontend use (optional).
    """

    translations = {
        "en": {
            "welcome": "Welcome",
            "home": "Home",
            "about": "About",
            "contact": "Contact",
            "login": "Login",
            "logout": "Logout",
            "email": "Email",
            "password": "Password",
            "submit": "Submit",
            "cancel": "Cancel",
            "save": "Save",
            "delete": "Delete",
            "edit": "Edit",
            "search": "Search",
        },
        "fr": {
            "welcome": "Bienvenue",
            "home": "Accueil",
            "about": "À propos",
            "contact": "Contact",
            "login": "Connexion",
            "logout": "Déconnexion",
            "email": "E-mail",
            "password": "Mot de passe",
            "submit": "Soumettre",
            "cancel": "Annuler",
            "save": "Enregistrer",
            "delete": "Supprimer",
            "edit": "Modifier",
            "search": "Rechercher",
        },
        "rw": {
            "welcome": "Murakaza neza",
            "home": "Ahabanza",
            "about": "Abo turi",
            "contact": "Twandikire",
            "login": "Injira",
            "logout": "Sohoka",
            "email": "Imeri",
            "password": "Ijambo ry'ibanga",
            "submit": "Ohereza",
            "cancel": "Hagarika",
            "save": "Bika",
            "delete": "Siba",
            "edit": "Hindura",
            "search": "Shakisha",
        }
    }

    return JsonResponse(translations)
