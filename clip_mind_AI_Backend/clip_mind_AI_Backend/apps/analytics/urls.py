from django.urls import path
from .views import AnalyticsView, ContentInsightsView, ClassroomAnalyticsView

urlpatterns = [
    path("", AnalyticsView.as_view(), name="analytics-dashboard"),
    path("content", ContentInsightsView.as_view(), name="analytics-content"),
    path("classroom", ClassroomAnalyticsView.as_view(), name="analytics-classroom"),
]
