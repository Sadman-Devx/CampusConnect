import { useEffect, useState } from "react";
import { fetchStaffRequests, updateRequestStatus } from "../api/serviceRequestsApi";
import { AlertStatusBadge } from "../components/AlertBadges";

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

function formatDateTime(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ServiceRequestManager() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("loading");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [updatingId, setUpdatingId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});

  const load = (filter) => {
    fetchStaffRequests(filter)
      .then((data) => {
        setRequests(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key) => {
    setStatus("loading");
    setStatusFilter(key);
    load(key);
  };

  const handleUpdate = async (req, nextStatus) => {
    setUpdatingId(req.id);
    try {
      const updated = await updateRequestStatus(req.id, {
        status: nextStatus,
        staff_note: noteDrafts[req.id] ?? req.staff_note,
      });
      setRequests((prev) =>
        statusFilter ? prev.filter((r) => r.id !== req.id) : prev.map((r) => (r.id === req.id ? updated : r))
      );
    } catch {
      // leave the row as-is; staff can retry
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Service Requests</h2>
          <p className="mt-1 text-sm text-gray-500">Student requests and complaints awaiting a response.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => handleFilterChange(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                statusFilter === f.key ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {status === "loading" &&
          [1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}

        {status === "error" && (
          <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            Couldn&apos;t load requests right now.
          </p>
        )}

        {status === "ready" && requests.length === 0 && (
          <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No requests match this filter.
          </p>
        )}

        {status === "ready" &&
          requests.map((req) => (
            <div key={req.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{req.subject}</p>
                    <AlertStatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {req.student_username} · <span className="capitalize">{req.category}</span> · {formatDateTime(req.created_at)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">{req.description}</p>

              <input
                type="text"
                value={noteDrafts[req.id] ?? req.staff_note}
                onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))}
                placeholder="Add a note for the student (optional)"
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900
                  placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />

              <div className="mt-2 flex gap-2">
                {req.status !== "in_progress" && (
                  <button
                    type="button"
                    disabled={updatingId === req.id}
                    onClick={() => handleUpdate(req, "in_progress")}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium
                      text-amber-700 transition-all duration-200 hover:bg-amber-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    Mark In Progress
                  </button>
                )}
                {req.status !== "resolved" && (
                  <button
                    type="button"
                    disabled={updatingId === req.id}
                    onClick={() => handleUpdate(req, "resolved")}
                    className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium
                      text-green-700 transition-all duration-200 hover:bg-green-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}