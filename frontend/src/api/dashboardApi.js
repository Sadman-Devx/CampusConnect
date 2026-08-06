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

// ---- Real course enrollment (student-facing) ----
export const enrollInCourse = (courseId) =>
  apiClient.post(`/dashboard/registration/${courseId}/enroll/`).then((res) => res.data);

export const dropCourse = (courseId) =>
  apiClient.post(`/dashboard/registration/${courseId}/drop/`).then((res) => res.data);

export const fetchMyEnrollments = () =>
  apiClient.get("/dashboard/registration/mine/").then((res) => res.data);

// ---- Real scholarship applications (student-facing) ----
export const applyToScholarship = (itemId) =>
  apiClient.post(`/dashboard/financial-aid/${itemId}/apply/`).then((res) => res.data);

export const fetchMyApplications = () =>
  apiClient.get("/dashboard/financial-aid/mine/").then((res) => res.data);

// ---- Real event RSVPs (student-facing) ----
export const rsvpToEvent = (eventId) =>
  apiClient.post(`/dashboard/events/${eventId}/rsvp/`).then((res) => res.data);

export const cancelRsvp = (eventId) =>
  apiClient.delete(`/dashboard/events/${eventId}/rsvp/`);

export const fetchMyRsvps = () =>
  apiClient.get("/dashboard/events/mine/").then((res) => res.data);