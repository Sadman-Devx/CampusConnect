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