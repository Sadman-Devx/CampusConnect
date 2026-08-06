import apiClient from "./axiosClient";

export const registerRequest = (payload) =>
  apiClient.post("/auth/register/", payload).then((res) => res.data);

export const loginRequest = (payload) =>
  apiClient.post("/auth/login/", payload).then((res) => res.data);

export const fetchCurrentUser = () =>
  apiClient.get("/auth/me/").then((res) => res.data);

// FR-04: lets a student fill in major / academic_year / gpa so the
// recommendation engine can check scholarship & event eligibility.
export const updateProfile = (payload) =>
  apiClient.patch("/auth/me/", payload).then((res) => res.data);

// Advisor-side gap fix: assigned advisor/admin confirms a student's
// self-reported GPA against an official record.
export const verifyStudentGpa = (studentId) =>
  apiClient.post(`/auth/students/${studentId}/verify-gpa/`).then((res) => res.data);

export const requestPasswordReset = (email) =>
  apiClient.post("/auth/password-reset/", { email }).then((res) => res.data);

export const confirmPasswordReset = ({ uid, token, new_password }) =>
  apiClient.post("/auth/password-reset/confirm/", { uid, token, new_password }).then((res) => res.data);