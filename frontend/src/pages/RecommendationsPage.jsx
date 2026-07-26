import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecommendations } from "../api/recommendationsApi";
import RecommendationCard from "../components/RecommendationCard";
import RecommendationSkeleton from "../components/RecommendationSkeleton";
import ProfileCompletionForm from "../components/ProfileCompletionForm";

const TABS = [
  { key: "all", label: "All" },
  { key: "scholarships", label: "Scholarships" },
  { key: "events", label: "Events" },
];

const DELAY_CLASSES = ["animate-delay-1", "animate-delay-2", "animate-delay-3", "animate-delay-4"];

export default function RecommendationsPage() {
  const [tab, setTab] = useState("all");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const result = await fetchRecommendations(tab).catch(() => null);
      if (cancelled) return;
      if (result) {
        setData(result);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [tab, retryCount]);

  const handleTabChange = (key) => {
    setStatus("loading");
    setTab(key);
  };

  const handleRetry = () => {
    setStatus("loading");
    setRetryCount((c) => c + 1);
  };

  const scholarships = data?.scholarships ?? [];
  const events = data?.events ?? [];
  const totalCount = scholarships.length + events.length;
  const profileComplete = data?.profile_complete ?? true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 animate-fade-up">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Recommended for you</h1>
            <p className="mt-1 text-sm text-gray-500">
              Scholarships and events ranked by how well they match your profile.
            </p>
          </div>
        </div>

        {!profileComplete && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 animate-fade-in">
            <p className="text-sm font-medium text-amber-800">
              Complete your academic profile to unlock personalized matches
            </p>
            <p className="mt-1 text-sm text-amber-700">
              We use your major, academic year, and GPA to check eligibility and rank the best fit for you.
            </p>
            <ProfileCompletionForm onSaved={handleRetry} />
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 sm:inline-flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 sm:flex-none ${
                tab === t.key
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {status === "error" && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center animate-fade-in">
              <p className="text-sm font-medium text-red-700">
                We couldn&apos;t load your recommendations right now.
              </p>
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

          {status === "loading" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DELAY_CLASSES.map((delayClass, i) => (
                <RecommendationSkeleton key={i} delayClass={delayClass} />
              ))}
            </div>
          )}

          {status === "ready" && totalCount === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center animate-fade-in">
              <p className="text-sm font-medium text-gray-700">No matches yet</p>
              <p className="mt-1 text-sm text-gray-500">
                {profileComplete
                  ? "Check back soon — new scholarships and events are added regularly."
                  : "Fill in your profile above to see items you're eligible for."}
              </p>
            </div>
          )}

          {status === "ready" && totalCount > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(tab === "all" || tab === "scholarships") &&
                scholarships.map((item, i) => (
                  <RecommendationCard
                    key={`s-${item.id}`}
                    item={item}
                    kind="scholarship"
                    delayClass={DELAY_CLASSES[i % DELAY_CLASSES.length]}
                  />
                ))}
              {(tab === "all" || tab === "events") &&
                events.map((item, i) => (
                  <RecommendationCard
                    key={`e-${item.id}`}
                    item={item}
                    kind="event"
                    delayClass={DELAY_CLASSES[(scholarships.length + i) % DELAY_CLASSES.length]}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}