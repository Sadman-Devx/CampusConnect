const STYLES = {
  low: "bg-green-50 text-green-700 ring-green-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  high: "bg-red-50 text-red-700 ring-red-200",
};

const LABELS = { low: "Low", medium: "Medium", high: "High" };

export default function RiskBadge({ level }) {
  const style = STYLES[level] || "bg-gray-100 text-gray-600 ring-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${style}`}>
      {LABELS[level] || level}
    </span>
  );
}