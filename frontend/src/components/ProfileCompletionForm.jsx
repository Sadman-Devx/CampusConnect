import { useState } from "react";
import { updateProfile } from "../api/authApi";

const ACADEMIC_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export default function ProfileCompletionForm({ onSaved }) {
  const [major, setMajor] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [gpa, setGpa] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        major: major.trim() || null,
        academic_year: academicYear || null,
        gpa: gpa === "" ? null : Number(gpa),
      });
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.gpa?.[0] || "Couldn't save your profile. Please check the values and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
    >
      <input
        type="text"
        value={major}
        onChange={(e) => setMajor(e.target.value)}
        placeholder="Major, e.g. Computer Science"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
          placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      <select
        value={academicYear}
        onChange={(e) => setAcademicYear(e.target.value)}
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
        value={gpa}
        onChange={(e) => setGpa(e.target.value)}
        placeholder="GPA"
        className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
          placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
          transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
      {error && (
        <p className="col-span-full text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}