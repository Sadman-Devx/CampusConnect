import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyTickets } from "../api/chatbotApi";
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchMyTickets()
      .then((data) => {
        if (cancelled) return;
        setTickets(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRetry = () => {
    setStatus("loading");
    fetchMyTickets()
      .then((data) => {
        setTickets(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  const visibleTickets = statusFilter ? tickets.filter((t) => t.status === statusFilter) : tickets;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 animate-fade-up">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mt-5 text-2xl font-semibold text-gray-900">My Support Tickets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Questions the chatbot escalated to our staff team, and their status.
        </p>

        <div className="mt-6 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 sm:inline-flex">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 sm:flex-none ${
                statusFilter === f.key
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {status === "loading" &&
            [1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}

          {status === "error" && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center animate-fade-in">
              <p className="text-sm font-medium text-red-700">Couldn&apos;t load your tickets right now.</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium
                  text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-[0.98]"
              >
                Try again
              </button>
            </div>
          )}

          {status === "ready" && visibleTickets.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center animate-fade-in">
              <p className="text-sm font-medium text-gray-700">No tickets here</p>
              <p className="mt-1 text-sm text-gray-500">
                When the chatbot can&apos;t confidently answer a question, it opens a ticket here for you.
              </p>
            </div>
          )}

          {status === "ready" &&
            visibleTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">Ticket #{ticket.id}</p>
                  <AlertStatusBadge status={ticket.status} />
                </div>
                <p className="mt-1.5 text-sm text-gray-600">{ticket.query_text}</p>
                <p className="mt-2 text-xs text-gray-400">{formatDateTime(ticket.created_at)}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}