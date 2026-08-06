import apiClient from "./axiosClient";

export const startChatRequest = () =>
  apiClient.post("/chatbot/start/").then((res) => res.data);

export const sendMessageRequest = ({ sessionId, text }) =>
  apiClient
    .post("/chatbot/message/", { session_id: sessionId, text })
    .then((res) => res.data);

export const fetchChatHistory = (sessionId) =>
  apiClient.get(`/chatbot/history/${sessionId}/`).then((res) => res.data);

export const fetchMyTickets = () =>
  apiClient.get("/chatbot/tickets/").then((res) => res.data);

// ---- Staff-facing (advisor/admin) ----

export const fetchStaffTickets = (statusFilter = "") =>
  apiClient
    .get("/chatbot/tickets/staff/", { params: statusFilter ? { status: statusFilter } : {} })
    .then((res) => res.data);

export const updateTicketStatus = (ticketId, { status, staff_note = "" }) =>
  apiClient
    .patch(`/chatbot/tickets/${ticketId}/decide/`, { status, staff_note })
    .then((res) => res.data);