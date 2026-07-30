import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentDashboardPage from "./StudentDashboardPage";

const STAFF_ROLES = ["advisor", "admin"];

// /dashboard is a role-router, not a page of its own: students see their
// dashboard here, advisors/admins are sent straight to their own dashboard
// at /advisor. Keeping the two experiences fully separate (rather than one
// page showing both) so an advisor never sees student-only content like
// scholarship/event recommendations or the service-booking widgets.
export default function DashboardPage() {
  const { user } = useAuth();

  if (STAFF_ROLES.includes(user?.role)) {
    return <Navigate to="/advisor" replace />;
  }

  return <StudentDashboardPage />;
}