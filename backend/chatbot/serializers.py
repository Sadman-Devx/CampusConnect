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
    """Student-facing: their own ticket, including any staff reply."""
    class Meta:
        model = SupportTicket
        fields = ['id', 'query_text', 'status', 'staff_note', 'created_at', 'updated_at']
        read_only_fields = fields


class StaffSupportTicketSerializer(serializers.ModelSerializer):
    """Staff-facing: same ticket, plus who asked it -- this is the piece
    that was previously missing entirely."""
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = SupportTicket
        fields = ['id', 'user_username', 'query_text', 'status', 'staff_note', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_username', 'query_text', 'created_at', 'updated_at']


class StaffTicketStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[c for c, _ in SupportTicket.STATUS_CHOICES])
    staff_note = serializers.CharField(max_length=500, required=False, allow_blank=True)


class FAQEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQEntry
        fields = ['id', 'category', 'question', 'answer']