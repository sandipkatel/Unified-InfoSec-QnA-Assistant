
from django.contrib import admin
from django.urls import path
from .views import analyze_question

urlpatterns = [
    path('admin/', admin.site.urls),
    path ('analyze/', analyze_question, name = 'analyze_question'),
]
