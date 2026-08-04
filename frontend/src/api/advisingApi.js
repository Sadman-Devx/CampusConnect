import apiClient from "./axiosClient";

// ---- Student-facing: browse & request ----

export const fetchAdvisors = () =>
  apiClient.get("/advising/advisors/").then((res) => res.data);

export const fetchOpenSlots = (advisorId) =>
  apiClient
    .get("/advising/slots/open/", { params: { advisor: advisorId } })
    .then((res) => res.data);

export const fetchMyBookings = () =>
  apiClient.get("/advising/bookings/mine/").then((res) => res.data);

export const requestBooking = ({ slotId, reason }) =>
  apiClient
    .post("/advising/bookings/mine/", { slot: slotId, reason })
    .then((res) => res.data);

export const cancelBooking = (bookingId) =>
  apiClient.post(`/advising/bookings/mine/${bookingId}/cancel/`).then((res) => res.data);

// ---- Advisor-facing: manage slots & decide requests ----

export const fetchMySlots = () =>
  apiClient.get("/advising/slots/mine/").then((res) => res.data);

export const createSlot = ({ date, start_time, end_time }) =>
  apiClient
    .post("/advising/slots/mine/", { date, start_time, end_time })
    .then((res) => res.data);

export const deleteSlot = (slotId) =>
  apiClient.delete(`/advising/slots/mine/${slotId}/`).then((res) => res.data);

export const deactivateSlot = (slotId) =>
  apiClient
    .patch(`/advising/slots/mine/${slotId}/`, { is_active: false })
    .then((res) => res.data);

export const fetchPendingBookings = () =>
  apiClient.get("/advising/bookings/pending/").then((res) => res.data);

export const decideBooking = (bookingId, { status, advisor_note = "" }) =>
  apiClient
    .patch(`/advising/bookings/${bookingId}/decide/`, { status, advisor_note })
    .then((res) => res.data);

export const fetchMyAdvisorProfile = () =>
  apiClient.get("/advising/profile/mine/").then((res) => res.data);

export const updateMyAdvisorProfile = (payload) =>
  apiClient.patch("/advising/profile/mine/", payload).then((res) => res.data);

// ---- Admin-facing: advisor <-> student assignment ----

export const fetchStudentAssignments = () =>
  apiClient.get("/advising/assignments/").then((res) => res.data);

export const assignAdvisor = (studentId, advisorId) =>
  apiClient
    .patch(`/advising/assignments/${studentId}/`, { advisor_id: advisorId })
    .then((res) => res.data);