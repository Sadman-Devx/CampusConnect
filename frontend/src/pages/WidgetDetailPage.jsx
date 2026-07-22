import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { fetchDashboardData } from "../api/dashboardApi";
import { getWidgetBySlug } from "../config/dashboardWidgets";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ItemRow({ slug, item }) {
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
      </>
    );
  }

  if (slug === "registration") {
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-gray-900">
            {item.course_code} — {item.course_title}
          </p>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {item.seats_available} seats
          </span>
        </div>
        {item.schedule && <p className="mt-1 text-sm text-gray-500">{item.schedule}</p>}
      </>
    );
  }

  // events
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

  const Icon = widget.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 animate-fade-up">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-5 flex items-center gap-3">
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
                  <ItemRow slug={slug} item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}