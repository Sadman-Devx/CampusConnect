import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { validateUsername } from "../utils/validators";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {
      username: validateUsername(form.username),
      password: form.password ? "" : "Password is required.",
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((msg) => !msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login(form);
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirectTo, { replace: true });
    } else {
      setSubmitError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-green-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-green-100 bg-white p-8 shadow-sm shadow-green-100/50 animate-fade-up transition-shadow duration-300 hover:shadow-md hover:shadow-green-100">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mb-6 text-sm text-gray-500">Log in to Campus Connect</p>

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Username"
            value={form.username}
            onChange={handleChange("username")}
            error={errors.username}
            autoComplete="username"
            required
          />
          <FormField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            error={errors.password}
            autoComplete="current-password"
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
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-green-600 transition-colors duration-200 hover:text-green-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}