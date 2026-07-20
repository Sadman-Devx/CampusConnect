import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <button
          onClick={logout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium
            text-gray-700 hover:bg-gray-100"
        >
          Log out
        </button>
      </div>
      <p className="mt-4 text-gray-600">
        Welcome, <span className="font-medium">{user?.username}</span> — this route is
        protected and only reachable while authenticated.
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-gray-200 p-4">
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium text-gray-900">{user?.email}</dd>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <dt className="text-gray-500">Role</dt>
          <dd className="font-medium text-gray-900">{user?.role}</dd>
        </div>
      </dl>
    </div>
  );
}