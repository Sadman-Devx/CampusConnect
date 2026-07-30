import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchRiskScores,
  fetchAlerts,
  updateAlertStatus,
  triggerRiskComputation,
} from "../api/analyticsApi";
import RiskBadge from "../components/RiskBadge";
import { SeverityBadge, AlertStatusBadge } from "../components/AlertBadges";
import StudentRiskModal from "../components/StudentRiskModal";
import { RefreshIcon } from "../components/icons/DashboardIcons";

const RISK_FILTERS = [
  { key: "", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

const ALERT_STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "open", label: "Open" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "resolved", label: "Resolved" },
];

function formatDateTime(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdvisorDashboardPage() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentsStatus, setStudentsStatus] = useState("loading");
  const [riskFilter, setRiskFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [alertsStatus, setAlertsStatus] = useState("loading");
  const [alertStatusFilter, setAlertStatusFilter] = useState("open");
  const [updatingAlertId, setUpdatingAlertId] = useState(null);

  const [isRecomputing, setIsRecomputing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchRiskScores(riskFilter)
      .then((data) => {
        if (cancelled) return;
        setStudents(data);
        setStudentsStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStudentsStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [riskFilter, refreshTick]);

  const handleRiskFilterChange = (key) => {
    setStudentsStatus("loading");
    setRiskFilter(key);
  };

  useEffect(() => {
    let cancelled = false;
    fetchAlerts({ status: alertStatusFilter })
      .then((data) => {
        if (cancelled) return;
        setAlerts(data);
        setAlertsStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setAlertsStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [alertStatusFilter, refreshTick]);

  const handleAlertStatusFilterChange = (key) => {
    setAlertsStatus("loading");
    setAlertStatusFilter(key);
  };

  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      await triggerRiskComputation();
      setStudentsStatus("loading");
      setAlertsStatus("loading");
      setRefreshTick((t) => t + 1);
    } catch {
      // stat cards / lists simply keep showing the last known data
    } finally {
      setIsRecomputing(false);
    }
  };

  const handleAlertAction = async (alert, nextStatus) => {
    setUpdatingAlertId(alert.id);
    try {
      await updateAlertStatus(alert.id, nextStatus);
      setAlerts((prev) =>
        alertStatusFilter
          ? prev.filter((a) => a.id !== alert.id)
          : prev.map((a) => (a.id === alert.id ? { ...a, status: nextStatus } : a))
      );
    } catch {
      // leave the row as-is; advisor can retry
    } finally {
      setUpdatingAlertId(null);
    }
  };

  const counts = students.reduce(
    (acc, s) => {
      acc[s.risk_level] = (acc[s.risk_level] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 }
  );
  const openAlertCount = alerts.filter((a) => a.status === "open").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Advisor Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome, <span className="font-medium">{user?.username}</span> — at-risk students,
              predictive scores, and alerts that need follow-up.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecompute}
              disabled={isRecomputing}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm
                font-medium text-gray-700 transition-all duration-200 hover:border-green-300 hover:bg-green-50
                hover:text-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshIcon className={`h-4 w-4 ${isRecomputing ? "animate-spin" : ""}`} />
              {isRecomputing ? "Recomputing…" : "Recompute all scores"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700
                transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "High risk", value: counts.high, color: "text-red-600" },
            { label: "Medium risk", value: counts.medium, color: "text-amber-600" },
            { label: "Low risk", value: counts.low, color: "text-green-600" },
            { label: "Open alerts", value: openAlertCount, color: "text-gray-900" },
          ].map((card, i) => (
            <div
              key={card.label}
              className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-pop-in animate-delay-${
                i + 1
              }`}
            >
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* At-risk student list */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">At-risk students</h2>
            <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
              {RISK_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => handleRiskFilterChange(f.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    riskFilter === f.key
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {studentsStatus === "loading" && (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            )}

            {studentsStatus === "error" && (
              <p className="p-6 text-center text-sm text-red-600">
                Couldn&apos;t load risk scores right now.
              </p>
            )}

            {studentsStatus === "ready" && students.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-500">No students match this filter.</p>
            )}

            {studentsStatus === "ready" && students.length > 0 && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Risk level</th>
                    <th className="px-4 py-3 font-medium">Last computed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className="cursor-pointer transition-colors hover:bg-green-50/60"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{s.student_username}</td>
                      <td className="px-4 py-3 text-gray-700">{s.score.toFixed(0)}</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={s.risk_level} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDateTime(s.computed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Advisor alerts */}
        <section className="mt-10 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Advisor alerts</h2>
            <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
              {ALERT_STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => handleAlertStatusFilterChange(f.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    alertStatusFilter === f.key
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {alertsStatus === "loading" &&
              [1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}

            {alertsStatus === "error" && (
              <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
                Couldn&apos;t load alerts right now.
              </p>
            )}

            {alertsStatus === "ready" && alerts.length === 0 && (
              <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                No alerts match this filter.
              </p>
            )}

            {alertsStatus === "ready" &&
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200
                    bg-white p-4 shadow-sm animate-fade-in"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{alert.student_username}</span>
                      <SeverityBadge severity={alert.severity} />
                      <AlertStatusBadge status={alert.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{alert.reason}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(alert.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    {alert.status === "open" && (
                      <button
                        type="button"
                        disabled={updatingAlertId === alert.id}
                        onClick={() => handleAlertAction(alert, "acknowledged")}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium
                          text-amber-700 transition-all duration-200 hover:bg-amber-100 active:scale-[0.98] disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== "resolved" && (
                      <button
                        type="button"
                        disabled={updatingAlertId === alert.id}
                        onClick={() => handleAlertAction(alert, "resolved")}
                        className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium
                          text-green-700 transition-all duration-200 hover:bg-green-100 active:scale-[0.98] disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      {selectedStudent && (
        <StudentRiskModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}