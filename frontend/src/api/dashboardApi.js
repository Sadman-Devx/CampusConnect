import apiClient from "./axiosClient";

export const fetchDashboardData = () =>
  apiClient.get("/dashboard/").then((res) => res.data);

// Fire-and-forget analytics call — a failure here should never block navigation.
export const logWidgetClick = (widget) =>
  apiClient.post("/dashboard/log/", { widget }).catch(() => {});

// ---- Financial Aid management (advisor/admin only) ----
export const fetchFinancialAidItems = () =>
  apiClient.get("/dashboard/manage/financial-aid/").then((res) => res.data);

export const createFinancialAidItem = (data) =>
  apiClient.post("/dashboard/manage/financial-aid/", data).then((res) => res.data);

export const updateFinancialAidItem = (id, data) =>
  apiClient.patch(`/dashboard/manage/financial-aid/${id}/`, data).then((res) => res.data);

export const deleteFinancialAidItem = (id) =>
  apiClient.delete(`/dashboard/manage/financial-aid/${id}/`);

// ---- Event management (advisor/admin only) ----
export const fetchEventItems = () =>
  apiClient.get("/dashboard/manage/events/").then((res) => res.data);

export const createEventItem = (data) =>
  apiClient.post("/dashboard/manage/events/", data).then((res) => res.data);

export const updateEventItem = (id, data) =>
  apiClient.patch(`/dashboard/manage/events/${id}/`, data).then((res) => res.data);

export const deleteEventItem = (id) =>
  apiClient.delete(`/dashboard/manage/events/${id}/`);