import { ChevronRightIcon } from "./icons/DashboardIcons";

export default function DashboardWidgetCard({ widget, summary, delayClass, onClick }) {
  const Icon = widget.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${widget.title}`}
      className={`group flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white p-5
        text-left shadow-sm transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
        active:scale-[0.98] animate-pop-in ${delayClass} ${widget.theme.ring}`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${widget.theme.iconBg} ${widget.theme.iconText}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <ChevronRightIcon
          className="h-5 w-5 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gray-400"
        />
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">{widget.title}</h3>
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{widget.description}</p>

      <div className="mt-auto pt-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-gray-900">{summary.stat}</span>
          <span className="text-sm text-gray-500">{summary.statLabel}</span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-gray-600" title={summary.highlight}>
          {summary.highlight}
        </p>
      </div>
    </button>
  );
}