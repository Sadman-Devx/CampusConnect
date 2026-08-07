import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { fetchDashboardData, applyToScholarship, enrollInCourse, dropCourse, rsvpToEvent, cancelRsvp } from "../api/dashboardApi";
import { getWidgetBySlug } from "../config/dashboardWidgets";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ActionButton({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200
        hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all
        duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ItemRow({ slug, item, onItemChange }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (slug === "advising") {
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-gray-900">{item.title}</p>
          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            {item.status}
          </span>
        </div>
        {item.advisor_name && (
          <p className="mt-1 text-sm text-gray-500">Advisor: {item.advisor_name}</p>
        )}
        {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
      </>
    );
  }

  if (slug === "financial-aid") {
    const handleApply = async () => {
      setIsSubmitting(true);
      setError("");
      try {
        await applyToScholarship(item.id);
        onItemChange(item.id, { is_applied: true });
      } catch (err) {
        setError(err.response?.data?.detail || "Couldn't submit your application.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-gray-900">{item.title}</p>
          {item.amount != null && (
            <span className="shrink-0 font-semibold text-amber-700">
              ${Number(item.amount).toLocaleString()}
            </span>
          )}
        </div>
        {item.deadline && (
          <p className="mt-1 text-sm text-gray-500">Deadline: {formatDate(item.deadline)}</p>
        )}
        {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3">
          {item.is_applied ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
              Applied
            </span>
          ) : (
            <ActionButton onClick={handleApply} disabled={isSubmitting}>
              {isSubmitting ? "Applying…" : "Apply"}
            </ActionButton>
          )}
        </div>
      </>
    );
  }

  if (slug === "registration") {
    const handleEnroll = async () => {
      setIsSubmitting(true);
      setError("");
      try {
        const updated = await enrollInCourse(item.id);
        onItemChange(item.id, updated);
      } catch (err) {
        setError(err.response?.data?.detail || "Couldn't enroll in this course.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleDrop = async () => {
      setIsSubmitting(true);
      setError("");
      try {
        const updated = await dropCourse(item.id);
        onItemChange(item.id, updated);
      } catch (err) {
        setError(err.response?.data?.detail || "Couldn't drop this course.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const isFull = item.seats_available <= 0 && !item.is_enrolled;

    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-gray-900">
            {item.course_code} — {item.course_title}
          </p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isFull ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-700"
            }`}
          >
            {item.seats_available} seats
          </span>
        </div>
        {item.schedule && <p className="mt-1 text-sm text-gray-500">{item.schedule}</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3">
          {item.is_enrolled ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                Enrolled
              </span>
              <SecondaryButton onClick={handleDrop} disabled={isSubmitting}>
                {isSubmitting ? "Dropping…" : "Drop"}
              </SecondaryButton>
            </div>
          ) : (
            <ActionButton onClick={handleEnroll} disabled={isSubmitting || isFull}>
              {isSubmitting ? "Registering…" : isFull ? "Full" : "Register"}
            </ActionButton>
          )}
        </div>
      </>
    );
  }

  // events
  const handleRsvp = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await rsvpToEvent(item.id);
      onItemChange(item.id, { is_rsvpd: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't RSVP to this event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRsvp = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await cancelRsvp(item.id);
      onItemChange(item.id, { is_rsvpd: false });
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't cancel your RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-gray-900">{item.title}</p>
        <span className="shrink-0 text-sm font-medium text-purple-700">
          {formatDate(item.date)}
        </span>
      </div>
      {item.location && <p className="mt-1 text-sm text-gray-500">{item.location}</p>}
      {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3">
        {item.is_rsvpd ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
              RSVP&apos;d
            </span>
            <SecondaryButton onClick={handleCancelRsvp} disabled={isSubmitting}>
              {isSubmitting ? "Cancelling…" : "Cancel"}
            </SecondaryButton>
          </div>
        ) : (
          <ActionButton onClick={handleRsvp} disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "RSVP"}
          </ActionButton>
        )}
      </div>
    </>
  );
}

export default function WidgetDetailPage() {
  const { slug } = useParams();
  const widget = getWidgetBySlug(slug);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    if (!widget) return;
    let cancelled = false;

    const load = async () => {
      const data = await fetchDashboardData().catch(() => null);
      if (cancelled) return;
      if (data) {
        setItems(data?.[widget.key] || []);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [widget]);

  if (!widget) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleItemChange = (itemId, patch) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it)));
  };

  const Icon = widget.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-lg ${widget.theme.iconBg} ${widget.theme.iconText}`}
          >
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{widget.title}</h1>
            <p className="text-sm text-gray-500">{widget.description}</p>
          </div>
        </div>

        <div className="mt-8">
          {status === "loading" && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
              <p className="text-sm font-medium text-red-700">
                We couldn&apos;t load this section. Please try again shortly.
              </p>
            </div>
          )}

          {status === "ready" && items.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm text-gray-500">Nothing to show here yet.</p>
            </div>
          )}

          {status === "ready" && items.length > 0 && (
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li
                  key={item.id ?? i}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md animate-pop-in"
                  style={{ animationDelay: `${Math.min(i, 6) * 0.05}s` }}
                >
                  <ItemRow slug={slug} item={item} onItemChange={handleItemChange} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}