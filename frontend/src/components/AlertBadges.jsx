const SEVERITY_STYLES = {
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  critical: "bg-red-50 text-red-700 ring-red-200",
};

const STATUS_STYLES = {
  open: "bg-red-50 text-red-700 ring-red-200",
  pending: "bg-red-50 text-red-700 ring-red-200",
  acknowledged: "bg-amber-50 text-amber-700 ring-amber-200",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  resolved: "bg-green-50 text-green-700 ring-green-200",
};

function Pill({ style, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${style}`}>
      {typeof children === "string" ? children.replace(/_/g, " ") : children}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  return <Pill style={SEVERITY_STYLES[severity] || "bg-gray-100 text-gray-600 ring-gray-200"}>{severity}</Pill>;
}

export function AlertStatusBadge({ status }) {
  return <Pill style={STATUS_STYLES[status] || "bg-gray-100 text-gray-600 ring-gray-200"}>{status}</Pill>;
}