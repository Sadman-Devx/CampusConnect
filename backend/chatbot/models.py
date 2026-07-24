from django.db import models
from django.conf import settings


class FAQEntry(models.Model):
    """Knowledge base — chatbot ei FAQ list-er shathe student-er query match kore"""
    CATEGORY_CHOICES = (
        ('advising', 'Advising'),
        ('financial_aid', 'Financial Aid'),
        ('registration', 'Registration'),
        ('events', 'Events'),
        ('general', 'General'),
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    question = models.CharField(max_length=255)
    keywords = models.CharField(max_length=500, help_text="Comma-separated keywords used for matching")
    answer = models.TextField()

    def __str__(self):
        return self.question


class ChatSession(models.Model):
    """Ekta student-er ekta chat session — multiple message er jonno grouping"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_sessions")
    started_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Session #{self.id} - {self.user.username}"


class ChatMessage(models.Model):
    """Session-er bhitore protyekta message (student query + bot response)"""
    SENDER_CHOICES = (
        ('user', 'User'),
        ('bot', 'Bot'),
    )
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    text = models.TextField()
    confidence = models.FloatField(null=True, blank=True, help_text="Intent match confidence score (0-1), bot message-er jonno")
    matched_faq = models.ForeignKey(FAQEntry, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.sender}] {self.text[:40]}"


class SupportTicket(models.Model):
    """Confidence threshold-er nichey gele — staff queue-te escalate kora ticket"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_tickets")
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="tickets")
    query_text = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ticket #{self.id} - {self.status}"
