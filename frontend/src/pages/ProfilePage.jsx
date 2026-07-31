import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../api/authApi";

const ACADEMIC_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    major: user?.major || "",
    academic_year: user?.academic_year || "",
    gpa: user?.gpa ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const startEditing = () => {
    setForm({
      major: user?.major || "",
      academic_year: user?.academic_year || "",
      gpa: user?.gpa ?? "",
    });
    setError("");
    setSuccessMessage("");
    setIsEditing(true);
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await updateProfile({
        major: form.major.trim() || null,
        academic_year: form.academic_year || null,
        gpa: form.gpa === "" ? null : Number(form.gpa),
      });
      await refreshUser?.();
      setIsEditing(false);
      setSuccessMessage("Profile updated.");
    } catch (err) {
      setError(
        err.response?.data?.gpa?.[0] ||
          err.response?.data?.detail ||
          "Couldn't save your profile. Please check the values and try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 animate-fade-up">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mt-5 text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your account details and academic info used for personalized recommendations.
        </p>

        {successMessage && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 animate-fade-in">
            {successMessage}
          </p>
        )}

        {/* Account info -- read-only, managed elsewhere (registration / admin) */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pop-in animate-delay-1">
          <h2 className="text-sm font-semibold text-gray-800">Account</h2>
          <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-gray-500">Username</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{user?.username}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Email</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Role</dt>
              <dd className="mt-0.5 font-medium capitalize text-gray-900">{user?.role}</dd>
            </div>
            {user?.student_id && (
              <div>
                <dt className="text-xs text-gray-500">Student ID</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{user.student_id}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Academic info -- editable, powers FR-04 recommendations */}
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pop-in animate-delay-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Academic info</h2>
            {!isEditing && (
              <button
                type="button"
                onClick={startEditing}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700
                  transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:scale-[0.98]"
              >
                Edit
              </button>
            )}
          </div>

          {!isEditing ? (
            <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-gray-500">Major</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{user?.major || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Academic year</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{user?.academic_year || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">GPA</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{user?.gpa ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={form.major}
                onChange={handleChange("major")}
                placeholder="Major, e.g. Computer Science"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                  placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <select
                value={form.academic_year}
                onChange={handleChange("academic_year")}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                  focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Academic year</option>
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={form.gpa}
                onChange={handleChange("gpa")}
                placeholder="GPA"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                  placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />

              {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

              <div className="col-span-full flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
                    transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600
                    transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}