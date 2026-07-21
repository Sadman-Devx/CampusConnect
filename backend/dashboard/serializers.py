from rest_framework import serializers
from .models import AdvisingItem, FinancialAidItem, RegistrationItem, EventItem, NavigationLog


class AdvisingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvisingItem
        fields = '__all__'


class FinancialAidItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialAidItem
        fields = '__all__'


class RegistrationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationItem
        fields = '__all__'


class EventItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventItem
        fields = '__all__'


class NavigationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NavigationLog
        fields = ['id', 'widget', 'clicked_at']
        read_only_fields = ['id', 'clicked_at']