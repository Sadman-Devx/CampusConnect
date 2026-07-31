import { Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AdvisorRoute from "./components/AdvisorRoute";
import StudentRoute from "./components/StudentRoute";
import { AuthProvider } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WidgetDetailPage from "./pages/WidgetDetailPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import AdvisorDashboardPage from "./pages/AdvisorDashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          {/* /dashboard is a role-router: student -> student dashboard, advisor/admin -> /advisor */}
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route element={<StudentRoute />}>
            <Route path="/dashboard/:slug" element={<WidgetDetailPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
          </Route>

          <Route element={<AdvisorRoute />}>
            <Route path="/advisor" element={<AdvisorDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;