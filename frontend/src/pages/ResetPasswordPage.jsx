import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormField from "../components/FormField";
import { confirmPasswordReset } from "../api/authApi";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const missingLink = !uid || !token;

  const validate = () => {
    const nextErrors = {
      password: password.length < 8 ? "Password must be at least 8 characters." : "",
      confirmPassword: password !== confirmPassword ? "Passwords don't match." : "",
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((msg) => !msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await confirmPasswordReset({ uid, token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      const detail = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || "This reset link is invalid or has expired.";
      setSubmitError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-green-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-green-100 bg-white p-8 shadow-sm shadow-green-100/50 animate-fade-up transition-shadow duration-300 hover:shadow-md hover:shadow-green-100">
        {missingLink ? (
          <>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Invalid link</h1>
            <p className="mb-6 text-sm text-gray-500">
              This password reset link is missing required information. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="block w-full rounded-lg bg-green-600 py-2.5 text-center text-sm font-medium text-white
                transition-all duration-200 hover:bg-green-700 hover:shadow-md hover:shadow-green-200 active:scale-[0.98]"
            >
              Request new link
            </Link>
          </>
        ) : success ? (
          <>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Password reset!</h1>
            <p className="mb-6 text-sm text-gray-500">Redirecting you to login…</p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Set a new password</h1>
            <p className="mb-6 text-sm text-gray-500">Choose a new password for your account.</p>

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="new-password"
                required
              />
              <FormField
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
                required
              />

              {submitError && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 animate-fade-in">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white
                  transition-all duration-200 hover:bg-green-700 hover:shadow-md hover:shadow-green-200
                  active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSubmitting ? "Resetting…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}