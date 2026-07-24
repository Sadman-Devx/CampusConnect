from django.contrib import admin
from .models import FAQEntry, ChatSession, ChatMessage, SupportTicket

admin.site.register(FAQEntry)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
admin.site.register(SupportTicket)
