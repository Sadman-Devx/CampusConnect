import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyToScholarship, rsvpToEvent } from "../api/dashboardApi";
import { CheckCircleIcon } from "./icons/DashboardIcons";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function matchColor(pct) {
  if (pct >= 75) return { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200" };
  if (pct >= 50) return { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" };
  return { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" };
}

export default function RecommendationCard({ item, kind, delayClass }) {
  // kind: "scholarship" | "event"
  const [isApplied, setIsApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const badge = matchColor(item.match_percentage);
  const isScholarship = kind === "scholarship";
  const actionLabel = isScholarship ? "Apply" : "RSVP";
  const detailSlug = isScholarship ? "financial-aid" : "events";

  const handleApply = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      if (isScholarship) {
        await applyToScholarship(item.id);
      } else {
        await rsvpToEvent(item.id);
      }
      setIsApplied(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail?.toLowerCase().includes("already")) {
        // Already applied/RSVP'd from another screen -- treat as success, not an error.
        setIsApplied(true);
      } else {
        setError(detail || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-pop-in ${delayClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
        <span
          className={`shrink-0 rounded-full ${badge.bg} ${badge.text} ring-1 ${badge.ring} px-2.5 py-0.5 text-xs font-semibold`}
        >
          {item.match_percentage}% match
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
        {isScholarship ? (
          <>
            {item.amount != null && (
              <span className="font-semibold text-amber-700">
                ${Number(item.amount).toLocaleString()}
              </span>
            )}
            {item.deadline && <span>Deadline: {formatDate(item.deadline)}</span>}
          </>
        ) : (
          <>
            {item.date && <span className="font-medium text-purple-700">{formatDate(item.date)}</span>}
            {item.location && <span>{item.location}</span>}
          </>
        )}
      </div>

      {item.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
      )}

      {item.match_reasons?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {item.match_reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <button
          type="button"
          onClick={handleApply}
          disabled={isApplied || isSubmitting}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200
            active:scale-[0.98] ${
              isApplied
                ? "cursor-default bg-green-50 text-green-700 ring-1 ring-green-200"
                : "bg-gray-900 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            }`}
        >
          {isApplied && <CheckCircleIcon className="h-4 w-4" />}
          {isApplied ? (isScholarship ? "Applied" : "RSVP'd") : isSubmitting ? "Sending…" : actionLabel}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/dashboard/${detailSlug}`)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-green-700"
        >
          View details
        </button>
      </div>
    </div>
  );
}