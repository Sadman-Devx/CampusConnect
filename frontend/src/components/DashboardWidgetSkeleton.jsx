export default function DashboardWidgetSkeleton({ delayClass }) {
  return (
    <div
      className={`flex h-full w-full animate-pulse flex-col rounded-xl border border-gray-200
        bg-white p-5 animate-fade-in ${delayClass}`}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between">
        <span className="h-11 w-11 rounded-lg bg-gray-100" />
        <span className="h-5 w-5 rounded bg-gray-100" />
      </div>
      <span className="mt-4 h-4 w-24 rounded bg-gray-100" />
      <span className="mt-2 h-3 w-32 rounded bg-gray-100" />
      <div className="mt-auto pt-4">
        <span className="block h-6 w-12 rounded bg-gray-100" />
        <span className="mt-2 block h-3 w-28 rounded bg-gray-100" />
      </div>
    </div>
  );
}