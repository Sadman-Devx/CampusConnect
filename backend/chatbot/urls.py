from django.urls import path
from .views import (
    StartChatView, SendMessageView, ChatHistoryView, MyTicketsView, FAQListView,
    StaffTicketListView, UpdateTicketStatusView,
)

urlpatterns = [
    path('start/', StartChatView.as_view(), name='chat-start'),
    path('message/', SendMessageView.as_view(), name='chat-message'),
    path('history/<int:session_id>/', ChatHistoryView.as_view(), name='chat-history'),
    path('tickets/', MyTicketsView.as_view(), name='my-tickets'),
    path('tickets/staff/', StaffTicketListView.as_view(), name='staff-ticket-list'),
    path('tickets/<int:pk>/decide/', UpdateTicketStatusView.as_view(), name='decide-ticket'),
    path('faqs/', FAQListView.as_view(), name='faq-list'),
]