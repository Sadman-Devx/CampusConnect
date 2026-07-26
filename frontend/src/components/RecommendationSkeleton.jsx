export default function RecommendationSkeleton({ delayClass }) {
  return (
    <div
      className={`flex h-full animate-pulse flex-col rounded-xl border border-gray-200
        bg-white p-5 animate-fade-in ${delayClass}`}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="h-4 w-2/3 rounded bg-gray-100" />
        <span className="h-5 w-16 shrink-0 rounded-full bg-gray-100" />
      </div>
      <span className="mt-3 h-3 w-1/2 rounded bg-gray-100" />
      <span className="mt-2 h-3 w-full rounded bg-gray-100" />
      <span className="mt-1.5 h-3 w-4/5 rounded bg-gray-100" />
      <div className="mt-auto flex gap-2 pt-4">
        <span className="h-8 w-20 rounded-lg bg-gray-100" />
        <span className="h-8 w-24 rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}