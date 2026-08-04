import { useEffect, useState } from "react";
import { fetchMyAdvisorProfile, updateMyAdvisorProfile } from "../api/advisingApi";

const EMPTY = { bio: "", department: "", specialization: "", office_location: "", years_experience: "" };

export default function AdvisorProfileEditor() {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(EMPTY);
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyAdvisorProfile()
      .then((data) => {
        const normalized = {
          bio: data.bio || "",
          department: data.department || "",
          specialization: data.specialization || "",
          office_location: data.office_location || "",
          years_experience: data.years_experience ?? "",
        };
        setSaved(normalized);
        setForm(normalized);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const startEditing = () => {
    setForm(saved);
    setError("");
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const updated = await updateMyAdvisorProfile({
        bio: form.bio.trim(),
        department: form.department.trim(),
        specialization: form.specialization.trim(),
        office_location: form.office_location.trim(),
        years_experience: form.years_experience === "" ? null : Number(form.years_experience),
      });
      const normalized = {
        bio: updated.bio || "",
        department: updated.department || "",
        specialization: updated.specialization || "",
        office_location: updated.office_location || "",
        years_experience: updated.years_experience ?? "",
      };
      setSaved(normalized);
      setIsEditing(false);
    } catch {
      setError("Couldn't save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return <div className="mt-10 h-40 animate-pulse rounded-xl border border-gray-200 bg-white" />;
  }
  if (status === "error") {
    return null;
  }

  const isEmpty = !saved.bio && !saved.department && !saved.specialization;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Advisor Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Shown to students when they're choosing who to book with.
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700
              transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:scale-[0.98]"
          >
            {isEmpty ? "Add profile info" : "Edit"}
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {isEmpty ? (
            <p className="text-sm text-gray-500">
              You haven&apos;t added a bio yet — students will just see your name and open slots.
            </p>
          ) : (
            <>
              {saved.bio && <p className="text-sm text-gray-700">{saved.bio}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {saved.department && <span>🏢 {saved.department}</span>}
                {saved.specialization && <span>🎯 {saved.specialization}</span>}
                {saved.office_location && <span>📍 {saved.office_location}</span>}
                {saved.years_experience !== "" && <span>⏱ {saved.years_experience} yrs experience</span>}
              </div>
            </>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <textarea
            value={form.bio}
            onChange={handleChange("bio")}
            placeholder="A short bio students will see, e.g. your approach to advising…"
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
              placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.department}
              onChange={handleChange("department")}
              placeholder="Department, e.g. Computer Science"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <input
              type="text"
              value={form.specialization}
              onChange={handleChange("specialization")}
              placeholder="Specialization, e.g. Career guidance"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <input
              type="text"
              value={form.office_location}
              onChange={handleChange("office_location")}
              placeholder="Office location"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <input
              type="number"
              min="0"
              value={form.years_experience}
              onChange={handleChange("years_experience")}
              placeholder="Years of experience"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
                transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? "Saving…" : "Save profile"}
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
  );
}