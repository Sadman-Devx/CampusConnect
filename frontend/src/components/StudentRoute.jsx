import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Assumes it renders inside ProtectedRoute (so auth/loading is already handled) —
// this guard keeps student-only pages (widgets, recommendations) out of reach
// for advisor/admin accounts, who have their own dashboard at /advisor.
export default function StudentRoute() {
  const { user } = useAuth();

  if (user?.role !== "student") {
    return <Navigate to="/advisor" replace />;
  }

  return <Outlet />;
}