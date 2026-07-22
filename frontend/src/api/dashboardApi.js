import apiClient from "./axiosClient";

export const fetchDashboardData = () =>
  apiClient.get("/dashboard/").then((res) => res.data);

// Fire-and-forget analytics call — a failure here should never block navigation.
export const logWidgetClick = (widget) =>
  apiClient.post("/dashboard/log/", { widget }).catch(() => {});