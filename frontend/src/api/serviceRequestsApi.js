import apiClient from "./axiosClient";

// ---- Student-facing ----

export const fetchMyRequests = () =>
  apiClient.get("/requests/mine/").then((res) => res.data);

export const submitRequest = ({ category, subject, description }) =>
  apiClient
    .post("/requests/mine/", { category, subject, description })
    .then((res) => res.data);

// ---- Advisor/Admin-facing ----

export const fetchStaffRequests = (statusFilter = "") =>
  apiClient
    .get("/requests/staff/", { params: statusFilter ? { status: statusFilter } : {} })
    .then((res) => res.data);

export const updateRequestStatus = (requestId, { status, staff_note = "" }) =>
  apiClient
    .patch(`/requests/${requestId}/update/`, { status, staff_note })
    .then((res) => res.data);