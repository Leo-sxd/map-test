from django.urls import path
from . import views

urlpatterns = [
    path('query_by_time/', views.query_by_time, name='query_by_time'),
    path('query_by_car/', views.query_by_car, name='query_by_car'),
    path('test/', views.test_api, name='test_api'),
]
