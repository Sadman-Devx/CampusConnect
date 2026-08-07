import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, uploadAvatar } from "../api/authApi";
import {
  CameraIcon, CheckCircleIcon, IdCardIcon, MailIcon, PhoneIcon,
  MapPinIcon, CalendarIcon, GenderIcon, DropletIcon,
} from "../components/icons/DashboardIcons";

const ACADEMIC_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="truncate text-sm font-medium text-gray-900">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const avatarInputRef = useRef(null);

  // -- Academic info (major / academic_year / gpa) -- FR-04 recommendations --
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [academicForm, setAcademicForm] = useState({
    major: user?.major || "",
    academic_year: user?.academic_year || "",
    gpa: user?.gpa ?? "",
  });
  const [isSavingAcademic, setIsSavingAcademic] = useState(false);
  const [academicError, setAcademicError] = useState("");

  // -- Personal info (profile card fields) --
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    full_name: user?.full_name || "",
    phone_number: user?.phone_number || "",
    program: user?.program || "",
    campus: user?.campus || "",
    date_of_birth: user?.date_of_birth || "",
    gender: user?.gender || "",
    blood_group: user?.blood_group || "",
  });
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalError, setPersonalError] = useState("");

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const startEditingAcademic = () => {
    setAcademicForm({
      major: user?.major || "",
      academic_year: user?.academic_year || "",
      gpa: user?.gpa ?? "",
    });
    setAcademicError("");
    setSuccessMessage("");
    setIsEditingAcademic(true);
  };

  const handleAcademicChange = (field) => (e) => {
    setAcademicForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleAcademicSubmit = async (e) => {
    e.preventDefault();
    setAcademicError("");
    setIsSavingAcademic(true);
    try {
      await updateProfile({
        major: academicForm.major.trim() || null,
        academic_year: academicForm.academic_year || null,
        gpa: academicForm.gpa === "" ? null : Number(academicForm.gpa),
      });
      await refreshUser?.();
      setIsEditingAcademic(false);
      setSuccessMessage("Profile updated.");
    } catch (err) {
      setAcademicError(
        err.response?.data?.gpa?.[0] ||
          err.response?.data?.detail ||
          "Couldn't save your profile. Please check the values and try again."
      );
    } finally {
      setIsSavingAcademic(false);
    }
  };

  const startEditingPersonal = () => {
    setPersonalForm({
      full_name: user?.full_name || "",
      phone_number: user?.phone_number || "",
      program: user?.program || "",
      campus: user?.campus || "",
      date_of_birth: user?.date_of_birth || "",
      gender: user?.gender || "",
      blood_group: user?.blood_group || "",
    });
    setPersonalError("");
    setSuccessMessage("");
    setIsEditingPersonal(true);
  };

  const handlePersonalChange = (field) => (e) => {
    setPersonalForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setPersonalError("");
    setIsSavingPersonal(true);
    try {
      await updateProfile({
        full_name: personalForm.full_name.trim(),
        phone_number: personalForm.phone_number.trim(),
        program: personalForm.program.trim() || null,
        campus: personalForm.campus.trim() || null,
        date_of_birth: personalForm.date_of_birth || null,
        gender: personalForm.gender.trim() || null,
        blood_group: personalForm.blood_group || null,
      });
      await refreshUser?.();
      setIsEditingPersonal(false);
      setSuccessMessage("Profile updated.");
    } catch (err) {
      setPersonalError(
        err.response?.data?.detail ||
          Object.values(err.response?.data || {})[0]?.[0] ||
          "Couldn't save your profile. Please check the values and try again."
      );
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleAvatarPick = () => avatarInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarError("");
    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      await refreshUser?.();
    } catch (err) {
      setAvatarError(
        err.response?.data?.avatar?.[0] || "Couldn't upload that photo. Please try a different file."
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 animate-fade-up">
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your account details and academic info used for personalized recommendations.
        </p>

        {successMessage && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 animate-fade-in">
            {successMessage}
          </p>
        )}

        {/* Profile card -- gradient header, avatar, quick-glance info */}
        <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm animate-pop-in animate-delay-1">
          <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 px-5 pb-14 pt-6">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Active
            </span>
          </div>

          <div className="px-5 pb-5">
            <div className="-mt-12 flex items-end justify-between">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-green-100 text-2xl font-semibold text-green-700 shadow-sm">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user?.full_name || user?.username || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAvatarPick}
                  disabled={isUploadingAvatar}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full
                    border-2 border-white bg-green-600 text-white shadow-sm transition-all duration-200
                    hover:bg-green-700 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CameraIcon className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              {!isEditingPersonal && (
                <button
                  type="button"
                  onClick={startEditingPersonal}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700
                    transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:scale-[0.98]"
                >
                  Edit
                </button>
              )}
            </div>

            {isUploadingAvatar && <p className="mt-2 text-xs text-gray-500">Uploading photo…</p>}
            {avatarError && <p className="mt-2 text-xs text-red-600">{avatarError}</p>}

            <h2 className="mt-3 text-lg font-semibold text-gray-900">
              {user?.full_name || user?.username}
            </h2>
            <p className="text-sm text-gray-500">{user?.program || "Program not set"}</p>

            {!isEditingPersonal ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem icon={IdCardIcon} label="Student ID" value={user?.student_id} />
                <InfoItem icon={MailIcon} label="Email" value={user?.email} />
                <InfoItem icon={PhoneIcon} label="Phone" value={user?.phone_number} />
                <InfoItem icon={MapPinIcon} label="Campus" value={user?.campus} />
                <InfoItem icon={CalendarIcon} label="Date of birth" value={formatDate(user?.date_of_birth)} />
                <InfoItem icon={GenderIcon} label="Gender" value={user?.gender} />
                <InfoItem icon={DropletIcon} label="Blood group" value={user?.blood_group} />
              </div>
            ) : (
              <form onSubmit={handlePersonalSubmit} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={personalForm.full_name}
                  onChange={handlePersonalChange("full_name")}
                  placeholder="Full name"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                    placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={personalForm.program}
                  onChange={handlePersonalChange("program")}
                  placeholder="Program, e.g. B.Sc. in Software Engineering"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                    placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="tel"
                  value={personalForm.phone_number}
                  onChange={handlePersonalChange("phone_number")}
                  placeholder="Phone number"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                    placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={personalForm.campus}
                  onChange={handlePersonalChange("campus")}
                  placeholder="Campus, e.g. DSC"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                    placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="date"
                  value={personalForm.date_of_birth}
                  onChange={handlePersonalChange("date_of_birth")}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                    focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={personalForm.gender}
                  onChange={handlePersonalChange("gender")}
                  placeholder="Gender (optional)"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                    placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <select
                  value={personalForm.blood_group}
                  onChange={handlePersonalChange("blood_group")}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                    focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Blood group (optional)</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                {personalError && <p className="col-span-full text-sm text-red-600">{personalError}</p>}

                <div className="col-span-full flex gap-2">
                  <button
                    type="submit"
                    disabled={isSavingPersonal}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
                      transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isSavingPersonal ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(false)}
                    disabled={isSavingPersonal}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600
                      transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Account info -- read-only, managed elsewhere (registration / admin) */}
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pop-in animate-delay-2">
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
            {user?.role === "student" && (
              <div>
                <dt className="text-xs text-gray-500">Assigned Advisor</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {user.advisor_username || "Not assigned yet"}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Academic info -- editable, powers FR-04 recommendations */}
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pop-in animate-delay-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Academic info</h2>
            {!isEditingAcademic && (
              <button
                type="button"
                onClick={startEditingAcademic}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700
                  transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:scale-[0.98]"
              >
                Edit
              </button>
            )}
          </div>

          {!isEditingAcademic ? (
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
            <form onSubmit={handleAcademicSubmit} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={academicForm.major}
                onChange={handleAcademicChange("major")}
                placeholder="Major, e.g. Computer Science"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                  placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <select
                value={academicForm.academic_year}
                onChange={handleAcademicChange("academic_year")}
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
                value={academicForm.gpa}
                onChange={handleAcademicChange("gpa")}
                placeholder="GPA"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                  placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />

              {academicError && <p className="col-span-full text-sm text-red-600">{academicError}</p>}

              <div className="col-span-full flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingAcademic}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
                    transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isSavingAcademic ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAcademic(false)}
                  disabled={isSavingAcademic}
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