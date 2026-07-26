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