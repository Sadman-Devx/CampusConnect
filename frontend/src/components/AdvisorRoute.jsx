import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STAFF_ROLES = ["advisor", "admin"];

// Assumes it renders inside ProtectedRoute (so auth/loading is already handled) —
// this guard only adds the extra role check on top.
export default function AdvisorRoute() {
  const { user } = useAuth();

  if (!STAFF_ROLES.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}