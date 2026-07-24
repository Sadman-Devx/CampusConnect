from rest_framework import serializers
from .models import ChatSession, ChatMessage, SupportTicket, FAQEntry


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'text', 'confidence', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'started_at', 'is_active', 'messages']


class SendMessageSerializer(serializers.Serializer):
    """Input serializer — student jokhon notun message pathay"""
    session_id = serializers.IntegerField(required=False, allow_null=True)
    text = serializers.CharField(max_length=1000)


class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['id', 'query_text', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class FAQEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQEntry
        fields = ['id', 'category', 'question', 'answer']
