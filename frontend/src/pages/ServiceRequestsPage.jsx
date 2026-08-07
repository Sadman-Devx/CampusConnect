import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchMyRequests, submitRequest } from "../api/serviceRequestsApi";
import { AlertStatusBadge } from "../components/AlertBadges";
import RequestThread from "../components/RequestThread";

const CATEGORIES = [
  { key: "academic", label: "Academic" },
  { key: "financial", label: "Financial" },
  { key: "technical", label: "Technical" },
  { key: "complaint", label: "Complaint" },
  { key: "other", label: "Other" },
];

const EMPTY_FORM = { category: "other", subject: "", description: "" };

function formatDateTime(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ServiceRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [requestsStatus, setRequestsStatus] = useState("loading");

  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadRequests = () => {
    fetchMyRequests()
      .then((data) => {
        setRequests(data);
        setRequestsStatus("ready");
      })
      .catch(() => setRequestsStatus("error"));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      await submitRequest(form);
      setForm(EMPTY_FORM);
      setSuccessMessage("Your request has been submitted.");
      setRequestsStatus("loading");
      loadRequests();
    } catch (err) {
      setFormError(
        err.response?.data?.subject?.[0] ||
          err.response?.data?.description?.[0] ||
          "Couldn't submit your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThreadUpdate = (updated) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 animate-fade-up">
        <h1 className="text-2xl font-semibold text-gray-900">Service Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit a request or complaint that isn't tied to a specific advisor meeting, and track its status here.
        </p>

        {/* Submit form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pop-in animate-delay-1"
        >
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: c.key }))}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  form.category === c.key
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={form.subject}
            onChange={handleChange("subject")}
            placeholder="Subject, e.g. Transcript has an error"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
              placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <textarea
            value={form.description}
            onChange={handleChange("description")}
            placeholder="Describe your request or complaint in a bit more detail…"
            required
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
              placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
              transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? "Submitting…" : "Submit request"}
          </button>
        </form>

        {/* My requests */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">My Requests</h2>
          <div className="mt-3 space-y-2">
            {requestsStatus === "loading" &&
              [1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}

            {requestsStatus === "error" && (
              <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                Couldn&apos;t load your requests right now.
              </p>
            )}

            {requestsStatus === "ready" && requests.length === 0 && (
              <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                You haven&apos;t submitted any requests yet.
              </p>
            )}

            {requestsStatus === "ready" &&
              requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-in"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.subject}</p>
                      <p className="text-xs capitalize text-gray-400">
                        {r.category}
                        {r.assigned_to_username && ` · Being handled by ${r.assigned_to_username}`}
                      </p>
                    </div>
                    <AlertStatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{r.description}</p>
                  {r.staff_note && (
                    <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-700">Staff note: </span>
                      {r.staff_note}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">Submitted {formatDateTime(r.created_at)}</p>

                  <RequestThread request={r} currentUsername={user?.username} onUpdate={handleThreadUpdate} />
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}