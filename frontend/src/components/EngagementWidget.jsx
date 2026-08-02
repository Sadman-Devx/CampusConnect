import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyEngagement } from "../api/analyticsApi";
import { PulseIcon } from "./icons/DashboardIcons";

// The backend's top_factors are advisor-facing, deficit-framed strings
// (e.g. "GPA is low relative to peers"). Showing that raw text to the
// student themselves would read as alarming rather than helpful, so each
// known factor is mapped to a constructive, actionable tip instead.
const FACTOR_TIPS = {
  "GPA is low relative to peers": {
    tip: "A little extra focus on coursework can go a long way — a study group or office hours can help.",
    link: null,
  },
  "Low portal/course engagement in the last 30 days": {
    tip: "Visiting your dashboard regularly helps you catch new opportunities and deadlines.",
    link: { to: "/dashboard", label: "Go to dashboard" },
  },
  "Long gap since last activity on the platform": {
    tip: "It's been a while since your last visit — check in often so things stay up to date for you.",
    link: { to: "/dashboard", label: "Go to dashboard" },
  },
  "Little to no contact with an academic advisor": {
    tip: "Booking a quick advising session is one of the fastest ways to get support.",
    link: { to: "/advising", label: "Book an advisor" },
  },
  "Early in the program with limited track record": {
    tip: "You're just getting started — that's completely normal.",
    link: null,
  },
};

const LEVEL_COPY = {
  low: {
    heading: "You're doing great!",
    sub: "Keep visiting your dashboard and staying active — it's working.",
    ring: "text-green-500",
    chip: "bg-green-50 text-green-700 ring-green-200",
  },
  medium: {
    heading: "You're doing okay.",
    sub: "A little more engagement could help you get even more out of CampusConnect.",
    ring: "text-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  high: {
    heading: "Let's build some momentum.",
    sub: "A few small steps can make a real difference — here's where to start.",
    ring: "text-red-400",
    chip: "bg-red-50 text-red-700 ring-red-200",
  },
};

export default function EngagementWidget() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | unavailable | error

  useEffect(() => {
    fetchMyEngagement()
      .then((res) => {
        setData(res);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus(err.response?.status === 503 ? "unavailable" : "error");
      });
  }, []);

  if (status === "loading") {
    return (
      <div className="mt-4 h-32 animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm" />
    );
  }

  // Not an error the student needs to see -- the model just isn't set up
  // yet, so the widget quietly steps aside rather than showing a scary
  // error box for something that isn't the student's problem.
  if (status === "unavailable" || status === "error") {
    return null;
  }

  const engagementScore = Math.round(100 - data.score);
  const copy = LEVEL_COPY[data.risk_level] || LEVEL_COPY.medium;
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - engagementScore / 100);

  const tips = (data.top_factors || [])
    .map((factor) => FACTOR_TIPS[factor] || { tip: factor, link: null })
    .slice(0, 2);

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pop-in animate-delay-3">
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg viewBox="0 0 60 60" className="h-16 w-16 -rotate-90">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#F3F4F6" strokeWidth="6" />
            <circle
              cx="30" cy="30" r="26" fill="none" strokeWidth="6" strokeLinecap="round"
              className={copy.ring}
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute text-sm font-semibold text-gray-900">{engagementScore}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PulseIcon className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">My Engagement</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${copy.chip}`}>
              {copy.heading}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{copy.sub}</p>
        </div>
      </div>

      {tips.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-gray-100 pt-3">
          {tips.map((t, i) => (
            <li key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-600">{t.tip}</span>
              {t.link && (
                <Link
                  to={t.link.to}
                  className="shrink-0 whitespace-nowrap font-medium text-green-600 transition-colors hover:text-green-700 hover:underline"
                >
                  {t.link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}