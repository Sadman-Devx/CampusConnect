import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardWidgets from "../components/DashboardWidgets";
import { SparkleIcon, ChevronRightIcon, UserIcon, TicketIcon } from "../components/icons/DashboardIcons";

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium
              text-gray-700 transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:scale-[0.98]"
          >
            Log out
          </button>
        </div>
        <p className="mt-4 text-gray-600">
          Welcome, <span className="font-medium">{user?.username}</span> — this route is
          protected and only reachable while authenticated.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:max-w-md">
          <div className="rounded-lg border border-green-100 bg-white p-4 shadow-sm animate-pop-in animate-delay-1 transition-shadow duration-300 hover:shadow-md hover:shadow-green-100">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{user?.email}</dd>
          </div>
          <div className="rounded-lg border border-green-100 bg-white p-4 shadow-sm animate-pop-in animate-delay-2 transition-shadow duration-300 hover:shadow-md hover:shadow-green-100">
            <dt className="text-gray-500">Role</dt>
            <dd className="font-medium text-gray-900">{user?.role}</dd>
          </div>
        </dl>

        <Link
          to="/recommendations"
          className="group mt-8 flex items-center justify-between gap-4 rounded-xl border border-green-200
            bg-gradient-to-r from-green-600 to-green-500 p-5 shadow-sm transition-all duration-200
            hover:-translate-y-0.5 hover:shadow-md animate-pop-in animate-delay-3"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 text-white">
              <SparkleIcon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Recommended for you</h3>
              <p className="text-sm text-green-50">
                Scholarships and events matched to your profile
              </p>
            </div>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-white transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to="/profile"
            className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200
              bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
              hover:border-green-200 animate-pop-in animate-delay-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">My Profile</h3>
                <p className="text-xs text-gray-500">View and edit your info</p>
              </div>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <Link
            to="/tickets"
            className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200
              bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
              hover:border-green-200 animate-pop-in animate-delay-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <TicketIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">My Support Tickets</h3>
                <p className="text-xs text-gray-500">Track questions escalated to staff</p>
              </div>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Quick access</h2>
          <p className="mt-1 text-sm text-gray-500">
            Jump straight into the tools you use most.
          </p>
          <DashboardWidgets />
        </div>
      </div>
    </div>
  );
}