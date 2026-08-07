import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon, AdvisingIcon, ClipboardIcon, TicketIcon, UserIcon, SparkleIcon,
  UsersIcon, MenuIcon, CloseIcon, LogoutIcon,
} from "./icons/DashboardIcons";

const STUDENT_NAV = [
  { label: "Dashboard", to: "/dashboard", icon: HomeIcon },
  { label: "Book Advisor", to: "/advising", icon: AdvisingIcon },
  { label: "Service Requests", to: "/requests", icon: ClipboardIcon },
  { label: "Support Tickets", to: "/tickets", icon: TicketIcon },
  { label: "Profile", to: "/profile", icon: UserIcon },
  { label: "Recommendations", to: "/recommendations", icon: SparkleIcon },
];

// Advisor/admin only have a single route (/advisor) -- Students, Service
// Requests and Support Tickets are sections on that one page (see
// AdvisorDashboardPage), not separate routes. These links point at in-page
// anchors instead; AdvisorDashboardPage scrolls to the matching section
// when its hash changes.
const STAFF_NAV = [
  { label: "Dashboard", to: "/advisor", hash: "", icon: HomeIcon },
  { label: "Students", to: "/advisor#students", hash: "#students", icon: UsersIcon },
  { label: "Service Requests", to: "/advisor#service-requests", hash: "#service-requests", icon: ClipboardIcon },
  { label: "Support Tickets", to: "/advisor#support-tickets", hash: "#support-tickets", icon: TicketIcon },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isStaff = user?.role === "advisor" || user?.role === "admin";
  const navItems = isStaff ? STAFF_NAV : STUDENT_NAV;

  const isActive = (item) =>
    isStaff
      ? location.pathname === "/advisor" && (location.hash || "") === (item.hash || "")
      : location.pathname === item.to;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navLinkClass = (item, mobile = false) =>
    `flex items-center gap-2 rounded-lg font-medium transition-all duration-200 ${
      mobile ? "px-3 py-2.5 text-sm" : "px-3 py-2 text-sm"
    } ${
      isActive(item)
        ? "bg-green-50 text-green-700"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to={isStaff ? "/advisor" : "/dashboard"} className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-sm font-semibold text-white">
              CC
            </span>
            <span className="hidden text-sm font-semibold text-gray-900 sm:inline">CampusConnect</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.label} to={item.to} className={navLinkClass(item)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <span className="max-w-[9rem] truncate text-sm text-gray-500">{user?.username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium
                text-gray-700 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
            >
              <LogoutIcon className="h-4 w-4" />
              Log out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((o) => !o)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300
              text-gray-700 transition-colors duration-200 hover:bg-gray-50 md:hidden"
          >
            {isMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <nav className="border-t border-gray-200 bg-white px-4 pb-3 pt-2 animate-fade-in md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={navLinkClass(item, true)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
              <span className="truncate px-3 text-sm text-gray-500">{user?.username}</span>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600
                  transition-colors duration-200 hover:bg-red-50"
              >
                <LogoutIcon className="h-4 w-4" />
                Log out
              </button>
            </div>
          </nav>
        )}
      </header>

      <Outlet />
    </div>
  );
}