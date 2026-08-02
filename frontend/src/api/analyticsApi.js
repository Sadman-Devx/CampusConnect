import apiClient from "./axiosClient";

// FR-05/FR-07: advisor/admin-only endpoints for the at-risk student list,
// advisor alert worklist, and student-level risk detail + history.

export const fetchRiskScores = (riskLevel = "") =>
  apiClient
    .get("/analytics/risk-scores/", {
      params: riskLevel ? { risk_level: riskLevel } : {},
    })
    .then((res) => res.data);

export const fetchStudentRiskDetail = (studentId) =>
  apiClient.get(`/analytics/risk-score/${studentId}/`).then((res) => res.data);

export const fetchAlerts = ({ status = "", severity = "" } = {}) =>
  apiClient
    .get("/analytics/alerts/", {
      params: {
        ...(status ? { status } : {}),
        ...(severity ? { severity } : {}),
      },
    })
    .then((res) => res.data);

export const updateAlertStatus = (alertId, status) =>
  apiClient
    .patch(`/analytics/alerts/${alertId}/`, { status })
    .then((res) => res.data);

export const triggerRiskComputation = (studentId = null) =>
  apiClient
    .post("/analytics/compute/", studentId ? { student_id: studentId } : {})
    .then((res) => res.data);

// Student-facing: the student's own score, reframed positively as
// "engagement" on the UI side (see EngagementWidget.jsx) rather than
// exposing the raw dropout-risk framing to the student themselves.
export const fetchMyEngagement = () =>
  apiClient.get("/analytics/risk-score/me/").then((res) => res.data);