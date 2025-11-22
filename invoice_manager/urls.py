from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin dashboard
    path('admin/', admin.site.urls),

    # Include all routes from the myapi application
    path('', include('myapi.urls')),
]
