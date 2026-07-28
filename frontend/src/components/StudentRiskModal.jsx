import { useEffect, useState } from "react";
import { fetchStudentRiskDetail } from "../api/analyticsApi";
import RiskBadge from "./RiskBadge";

function formatDateTime(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function StudentRiskModal({ student, onClose }) {
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    fetchStudentRiskDetail(student.student_id)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [student.student_id]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200
          bg-white p-6 shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{student.student_username}</h2>
            <p className="text-sm text-gray-500">Student ID #{student.student_id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {status === "loading" && (
          <div className="mt-6 animate-pulse space-y-3">
            <div className="h-16 rounded-lg bg-gray-100" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
        )}

        {status === "error" && (
          <p className="mt-6 text-sm text-red-600">Couldn&apos;t load this student&apos;s risk detail.</p>
        )}

        {status === "ready" && detail && (
          <>
            <div className="mt-5 flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div>
                <p className="text-3xl font-semibold text-gray-900">{detail.current.score.toFixed(0)}</p>
                <p className="text-xs text-gray-500">out of 100</p>
              </div>
              <div className="flex-1">
                <RiskBadge level={detail.current.risk_level} />
                <p className="mt-1 text-xs text-gray-500">
                  Model {detail.current.model_version} · {formatDateTime(detail.current.computed_at)}
                </p>
              </div>
            </div>

            {detail.current.top_factors?.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-800">Top contributing factors</h3>
                <ul className="mt-2 space-y-1.5">
                  {detail.current.top_factors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.history?.length > 1 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-800">Score history</h3>
                <ul className="mt-2 space-y-1.5">
                  {detail.history.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <span className="text-gray-500">{formatDateTime(point.computed_at)}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{point.score.toFixed(0)}</span>
                        <RiskBadge level={point.risk_level} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}