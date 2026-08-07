import apiClient from "./axiosClient";

// ---- Student-facing ----

export const fetchMyRequests = () =>
  apiClient.get("/requests/mine/").then((res) => res.data);

export const submitRequest = ({ category, subject, description }) =>
  apiClient
    .post("/requests/mine/", { category, subject, description })
    .then((res) => res.data);

// ---- Advisor/Admin-facing ----

export const fetchStaffRequests = (statusFilter = "", extraParams = {}) =>
  apiClient
    .get("/requests/staff/", {
      params: { ...(statusFilter ? { status: statusFilter } : {}), ...extraParams },
    })
    .then((res) => res.data);

export const updateRequestStatus = (requestId, { status, staff_note = "" }) =>
  apiClient
    .patch(`/requests/${requestId}/update/`, { status, staff_note })
    .then((res) => res.data);

export const claimRequest = (requestId) =>
  apiClient.post(`/requests/${requestId}/claim/`).then((res) => res.data);

export const releaseRequest = (requestId) =>
  apiClient.post(`/requests/${requestId}/release/`).then((res) => res.data);

// ---- Shared (student on own request, staff on any request) ----

export const uploadRequestAttachment = (requestId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient
    .post(`/requests/${requestId}/attachments/`, formData, {
      // Force axios to drop the instance's default JSON Content-Type so
      // the browser sets the correct multipart boundary itself.
      headers: { "Content-Type": undefined },
    })
    .then((res) => res.data);
};

export const postRequestComment = (requestId, text) =>
  apiClient.post(`/requests/${requestId}/comments/`, { text }).then((res) => res.data);