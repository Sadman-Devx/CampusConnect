import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateStudentId,
  validateUsername,
} from "../utils/validators";

const initialForm = {
  username: "",
  email: "",
  student_id: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
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
      email: validateEmail(form.email),
      student_id: validateStudentId(form.student_id),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((msg) => !msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await register({
      username: form.username.trim(),
      email: form.email.trim(),
      student_id: form.student_id.trim() || null,
      password: form.password,
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setSubmitError(result.message);
      if (result.fieldErrors) {
        setErrors((errs) => ({
          ...errs,
          ...Object.fromEntries(
            Object.entries(result.fieldErrors).map(([field, msgs]) => [
              field,
              Array.isArray(msgs) ? msgs[0] : msgs,
            ])
          ),
        }));
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-green-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-green-100 bg-white p-8 shadow-sm shadow-green-100/50 animate-fade-up transition-shadow duration-300 hover:shadow-md hover:shadow-green-100">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mb-6 text-sm text-gray-500">Join Campus Connect</p>

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
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            error={errors.email}
            autoComplete="email"
            required
          />
          <FormField
            label="Student ID"
            value={form.student_id}
            onChange={handleChange("student_id")}
            error={errors.student_id}
            placeholder="Optional"
            autoComplete="off"
          />
          <FormField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <FormField
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
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
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-green-600 transition-colors duration-200 hover:text-green-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}