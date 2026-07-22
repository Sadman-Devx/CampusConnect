import {
  AdvisingIcon,
  EventsIcon,
  FinancialAidIcon,
  RegistrationIcon,
} from "../components/icons/DashboardIcons";

// Single source of truth for the 4 dashboard widgets.
// `key` must match the field names returned by GET /api/dashboard/.
// `widget` must match the NavigationLog.WIDGET_CHOICES values on the backend.
export const DASHBOARD_WIDGETS = [
  {
    slug: "advising",
    key: "advising",
    widget: "advising",
    title: "Advising",
    description: "Book time with your academic advisor",
    icon: AdvisingIcon,
    theme: {
      iconBg: "bg-green-50",
      iconText: "text-green-600",
      ring: "hover:border-green-300 hover:shadow-green-100",
    },
    summarize: (items = []) => {
      const available = items.filter((i) => i.status === "Available").length;
      return {
        stat: items.length,
        statLabel: items.length === 1 ? "item" : "items",
        highlight: available
          ? `${available} available now`
          : "No open slots right now",
      };
    },
  },
  {
    slug: "financial-aid",
    key: "financial_aid",
    widget: "financial_aid",
    title: "Financial Aid",
    description: "Track awards, balances, and deadlines",
    icon: FinancialAidIcon,
    theme: {
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      ring: "hover:border-amber-300 hover:shadow-amber-100",
    },
    summarize: (items = []) => {
      const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      return {
        stat: items.length,
        statLabel: items.length === 1 ? "item" : "items",
        highlight:
          total > 0
            ? `$${total.toLocaleString()} total available`
            : "No active aid items",
      };
    },
  },
  {
    slug: "registration",
    key: "registration",
    widget: "registration",
    title: "Registration",
    description: "Browse open courses and seat availability",
    icon: RegistrationIcon,
    theme: {
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      ring: "hover:border-blue-300 hover:shadow-blue-100",
    },
    summarize: (items = []) => {
      const openSeats = items.reduce(
        (sum, i) => sum + Number(i.seats_available || 0),
        0
      );
      return {
        stat: items.length,
        statLabel: items.length === 1 ? "course" : "courses",
        highlight: `${openSeats} seat${openSeats === 1 ? "" : "s"} open`,
      };
    },
  },
  {
    slug: "events",
    key: "events",
    widget: "events",
    title: "Events",
    description: "See what's happening on campus",
    icon: EventsIcon,
    theme: {
      iconBg: "bg-purple-50",
      iconText: "text-purple-600",
      ring: "hover:border-purple-300 hover:shadow-purple-100",
    },
    summarize: (items = []) => {
      const next = [...items].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      )[0];
      return {
        stat: items.length,
        statLabel: items.length === 1 ? "event" : "events",
        highlight: next
          ? `Next: ${next.title}`
          : "No upcoming events",
      };
    },
  },
];

export const getWidgetBySlug = (slug) =>
  DASHBOARD_WIDGETS.find((w) => w.slug === slug);