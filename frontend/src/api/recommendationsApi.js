import apiClient from "./axiosClient";

// FR-04: fetch content-based ranked scholarships & events for the current student.
// category: "all" | "scholarships" | "events"
export const fetchRecommendations = (category = "all") =>
  apiClient
    .get("/recommendations/", { params: { category } })
    .then((res) => res.data);