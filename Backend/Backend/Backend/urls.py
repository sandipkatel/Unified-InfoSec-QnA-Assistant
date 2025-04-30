
from django.contrib import admin
from django.urls import path
from .views import analyze_question, analyze_questionnaire

urlpatterns = [
    path('admin/', admin.site.urls),
    path ('analyze/', analyze_question, name = 'analyze_question'),
    path ('batch/', analyze_questionnaire, name = 'analyze_questionnaire')
]
