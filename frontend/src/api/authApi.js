import apiClient from "./axiosClient";

export const registerRequest = (payload) =>
  apiClient.post("/auth/register/", payload).then((res) => res.data);

export const loginRequest = (payload) =>
  apiClient.post("/auth/login/", payload).then((res) => res.data);

export const fetchCurrentUser = () =>
  apiClient.get("/auth/me/").then((res) => res.data);