from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ChatSession, ChatMessage, SupportTicket, FAQEntry
from .serializers import (
    ChatSessionSerializer, SendMessageSerializer,
    SupportTicketSerializer, FAQEntrySerializer
)
from .intent_classifier import classify, CONFIDENCE_THRESHOLD

GREETING = "Hi! I'm the CampusConnect assistant. Ask me about advising, financial aid, registration, or events."


class StartChatView(APIView):
    """
    1. Open Chatbot()
    1.1 Initialize Chat()
    1.1.1 Greeting
    Notun ChatSession banay ar greeting message pathay
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session = ChatSession.objects.create(user=request.user)
        ChatMessage.objects.create(session=session, sender='bot', text=GREETING)
        return Response({
            "session_id": session.id,
            "message": GREETING,
        }, status=status.HTTP_201_CREATED)


class SendMessageView(APIView):
    """
    2. Type Query()
    2.1 Classify Intent()
    2.2 [High Confidence] Return Answer
    2.3 [Low Confidence] Route to Staff Queue() -> 2.3.1 Ticket Number
    2.4 Escalation Notice
    3. Display Answer / Ticket
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        text = serializer.validated_data['text']
        session_id = serializer.validated_data.get('session_id')

        if session_id:
            session = ChatSession.objects.filter(id=session_id, user=request.user).first()
            if not session:
                return Response({"detail": "Invalid session_id"}, status=status.HTTP_404_NOT_FOUND)
        else:
            session = ChatSession.objects.create(user=request.user)
            ChatMessage.objects.create(session=session, sender='bot', text=GREETING)

        # student-er message save koro
        ChatMessage.objects.create(session=session, sender='user', text=text)

        # 2.1 Classify Intent()
        best_faq, confidence = classify(text, FAQEntry.objects.all())

        if best_faq and confidence >= CONFIDENCE_THRESHOLD:
            # 2.2 High confidence -> direct answer
            bot_reply = best_faq.answer
            ChatMessage.objects.create(
                session=session, sender='bot', text=bot_reply,
                confidence=confidence, matched_faq=best_faq
            )
            return Response({
                "session_id": session.id,
                "type": "answer",
                "message": bot_reply,
                "confidence": confidence,
            }, status=status.HTTP_200_OK)
        else:
            # 2.3 Low confidence -> escalate to staff queue, generate ticket
            ticket = SupportTicket.objects.create(user=request.user, session=session, query_text=text)
            escalation_notice = (
                f"I'm not fully confident about that one, so I've forwarded it to our staff team. "
                f"Your ticket number is #{ticket.id} — someone will follow up soon."
            )
            ChatMessage.objects.create(
                session=session, sender='bot', text=escalation_notice, confidence=confidence
            )
            return Response({
                "session_id": session.id,
                "type": "escalated",
                "message": escalation_notice,
                "ticket_id": ticket.id,
                "confidence": confidence,
            }, status=status.HTTP_200_OK)


class ChatHistoryView(generics.RetrieveAPIView):
    """Ekta session-er pura conversation history dekhar jonno"""
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'session_id'

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class MyTicketsView(generics.ListAPIView):
    """Student nijer submitted ticket gulo dekhte pabe (FR-09 status tracking-er shathe connect hobe)"""
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user).order_by('-created_at')


class FAQListView(generics.ListAPIView):
    """Admin/debug-er jonno — shob FAQ dekhar endpoint"""
    serializer_class = FAQEntrySerializer
    permission_classes = [IsAuthenticated]
    queryset = FAQEntry.objects.all()
