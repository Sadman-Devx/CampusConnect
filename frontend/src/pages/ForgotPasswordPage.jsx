import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../components/FormField";
import { requestPasswordReset } from "../api/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      // Always show success — the backend intentionally never reveals
      // whether the email exists, to avoid leaking registered accounts.
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-green-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-green-100 bg-white p-8 shadow-sm shadow-green-100/50 animate-fade-up transition-shadow duration-300 hover:shadow-md hover:shadow-green-100">
        {submitted ? (
          <>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Check your email</h1>
            <p className="mb-6 text-sm text-gray-500">
              If an account exists for <span className="font-medium text-gray-700">{email}</span>,
              we've sent a link to reset your password.
            </p>
            <Link
              to="/login"
              className="block w-full rounded-lg bg-green-600 py-2.5 text-center text-sm font-medium text-white
                transition-all duration-200 hover:bg-green-700 hover:shadow-md hover:shadow-green-200 active:scale-[0.98]"
            >
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Forgot password?</h1>
            <p className="mb-6 text-sm text-gray-500">
              Enter your email and we'll send you a link to reset it.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                autoComplete="email"
                required
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white
                  transition-all duration-200 hover:bg-green-700 hover:shadow-md hover:shadow-green-200
                  active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSubmitting ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Remembered it?{" "}
              <Link to="/login" className="font-medium text-green-600 transition-colors duration-200 hover:text-green-700 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}