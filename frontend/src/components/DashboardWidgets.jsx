import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardData, logWidgetClick } from "../api/dashboardApi";
import { DASHBOARD_WIDGETS } from "../config/dashboardWidgets";
import DashboardWidgetCard from "./DashboardWidgetCard";
import DashboardWidgetSkeleton from "./DashboardWidgetSkeleton";

const DELAY_CLASSES = ["animate-delay-1", "animate-delay-2", "animate-delay-3", "animate-delay-4"];

export default function DashboardWidgets() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const result = await fetchDashboardData().catch(() => null);
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
  }, [retryCount]);

  const loadData = () => {
    setStatus("loading");
    setRetryCount((c) => c + 1);
  };

  const handleCardClick = (widgetConfig) => {
    logWidgetClick(widgetConfig.widget);
    navigate(`/dashboard/${widgetConfig.slug}`);
  };

  if (status === "error") {
    return (
      <div className="mt-8 rounded-xl border border-red-100 bg-red-50 p-6 text-center animate-fade-in">
        <p className="text-sm font-medium text-red-700">
          We couldn&apos;t load your dashboard widgets right now.
        </p>
        <button
          type="button"
          onClick={loadData}
          className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium
            text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-[0.98]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {status === "loading"
        ? DELAY_CLASSES.map((delayClass, i) => (
            <DashboardWidgetSkeleton key={i} delayClass={delayClass} />
          ))
        : DASHBOARD_WIDGETS.map((widgetConfig, i) => (
            <DashboardWidgetCard
              key={widgetConfig.slug}
              widget={widgetConfig}
              summary={widgetConfig.summarize(data?.[widgetConfig.key])}
              delayClass={DELAY_CLASSES[i]}
              onClick={() => handleCardClick(widgetConfig)}
            />
          ))}
    </div>
  );
}