import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchStaffRequests, updateRequestStatus, claimRequest, releaseRequest } from "../api/serviceRequestsApi";
import { AlertStatusBadge } from "../components/AlertBadges";
import RequestThread from "../components/RequestThread";

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

const OWNERSHIP_FILTERS = [
  { key: "", label: "All" },
  { key: "mine", label: "Mine" },
  { key: "unassigned", label: "Unclaimed" },
];

function formatDateTime(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ServiceRequestManager() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("loading");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [ownershipFilter, setOwnershipFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});

  const load = (filter, ownership) => {
    fetchStaffRequests(filter, ownership ? { [ownership]: 1 } : {})
      .then((data) => {
        setRequests(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load(statusFilter, ownershipFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (nextStatus, nextOwnership) => {
    setStatus("loading");
    setStatusFilter(nextStatus);
    setOwnershipFilter(nextOwnership);
    load(nextStatus, nextOwnership);
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

  const handleClaim = async (req) => {
    setClaimingId(req.id);
    try {
      const updated = await claimRequest(req.id);
      setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));
    } catch (err) {
      // 409 -- someone else already claimed it; refresh so the row reflects reality
      if (err.response?.status === 409) load(statusFilter, ownershipFilter);
    } finally {
      setClaimingId(null);
    }
  };

  const handleRelease = async (req) => {
    setClaimingId(req.id);
    try {
      const updated = await releaseRequest(req.id);
      setRequests((prev) =>
        ownershipFilter === "mine" ? prev.filter((r) => r.id !== req.id) : prev.map((r) => (r.id === req.id ? updated : r))
      );
    } catch {
      // leave as-is; staff can retry
    } finally {
      setClaimingId(null);
    }
  };

  const handleThreadUpdate = (updated) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Service Requests</h2>
          <p className="mt-1 text-sm text-gray-500">Student requests and complaints awaiting a response.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {OWNERSHIP_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(statusFilter, f.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  ownershipFilter === f.key ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(f.key, ownershipFilter)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  statusFilter === f.key ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{req.subject}</p>
                    <AlertStatusBadge status={req.status} />
                    {req.assigned_to_username && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          req.assigned_to_username === user?.username
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {req.assigned_to_username === user?.username ? "Claimed by you" : `Claimed by ${req.assigned_to_username}`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {req.student_username} · <span className="capitalize">{req.category}</span> · {formatDateTime(req.created_at)}
                  </p>
                </div>
                {req.assigned_to_username ? (
                  (req.assigned_to_username === user?.username || user?.role === "admin") && (
                    <button
                      type="button"
                      disabled={claimingId === req.id}
                      onClick={() => handleRelease(req)}
                      className="shrink-0 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600
                        transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      Release
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled={claimingId === req.id}
                    onClick={() => handleClaim(req)}
                    className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium
                      text-green-700 transition-all duration-200 hover:bg-green-100 disabled:opacity-50"
                  >
                    Claim
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">{req.description}</p>

              <input
                type="text"
                value={noteDrafts[req.id] ?? req.staff_note}
                onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))}
                placeholder="Status-change note (optional)"
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

              <RequestThread request={req} currentUsername={user?.username} onUpdate={handleThreadUpdate} />
            </div>
          ))}
      </div>
    </section>
  );
}