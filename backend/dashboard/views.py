from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import AdvisingItem, FinancialAidItem, RegistrationItem, EventItem
from .serializers import (
    AdvisingItemSerializer, FinancialAidItemSerializer,
    RegistrationItemSerializer, EventItemSerializer, NavigationLogSerializer
)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            "advising": AdvisingItemSerializer(AdvisingItem.objects.all(), many=True).data,
            "financial_aid": FinancialAidItemSerializer(FinancialAidItem.objects.all(), many=True).data,
            "registration": RegistrationItemSerializer(RegistrationItem.objects.all(), many=True).data,
            "events": EventItemSerializer(EventItem.objects.all(), many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)


class NavigationLogView(generics.CreateAPIView):
    serializer_class = NavigationLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)