import { useEffect, useState } from "react";
import {
  fetchMySlots, createSlot, deleteSlot,
  fetchPendingBookings, decideBooking,
} from "../api/advisingApi";

const EMPTY_SLOT = { date: "", start_time: "", end_time: "" };

function formatDate(value) {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(value) {
  // value like "14:00:00"
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function AvailabilityManager() {
  const [slots, setSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState("loading");
  const [form, setForm] = useState(EMPTY_SLOT);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [pending, setPending] = useState([]);
  const [pendingStatus, setPendingStatus] = useState("loading");
  const [decidingId, setDecidingId] = useState(null);

  const loadSlots = () => {
    fetchMySlots()
      .then((data) => {
        setSlots(data);
        setSlotsStatus("ready");
      })
      .catch(() => setSlotsStatus("error"));
  };

  const loadPending = () => {
    fetchPendingBookings()
      .then((data) => {
        setPending(data);
        setPendingStatus("ready");
      })
      .catch(() => setPendingStatus("error"));
  };

  useEffect(() => {
    loadSlots();
    loadPending();
  }, []);

  const handleFormChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormError("");
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError("");
    try {
      await createSlot(form);
      setForm(EMPTY_SLOT);
      setSlotsStatus("loading");
      loadSlots();
    } catch (err) {
      setFormError(
        err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.detail ||
          "Couldn't create the slot. Check the date and times."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await deleteSlot(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch {
      // Most likely a 409: slot already has a confirmed booking.
      setSlotsStatus("loading");
      loadSlots();
    }
  };

  const handleDecide = async (booking, status) => {
    setDecidingId(booking.id);
    try {
      await decideBooking(booking.id, { status });
      setPending((prev) => prev.filter((b) => b.id !== booking.id));
      setSlotsStatus("loading");
      loadSlots();
    } catch {
      // leave the row as-is; advisor can retry
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900">Advising Appointments</h2>
      <p className="mt-1 text-sm text-gray-500">
        Open time slots for students to book, and requests waiting on your decision.
      </p>

      {/* Pending requests */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Pending requests {pendingStatus === "ready" && `(${pending.length})`}
        </h3>
        <div className="mt-2 space-y-2">
          {pendingStatus === "loading" &&
            [1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}

          {pendingStatus === "ready" && pending.length === 0 && (
            <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No pending requests right now.
            </p>
          )}

          {pendingStatus === "ready" &&
            pending.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border
                  border-gray-200 bg-white p-4 shadow-sm animate-fade-in"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{booking.student_username}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(booking.slot_date)} · {formatTime(booking.slot_start_time)}–{formatTime(booking.slot_end_time)}
                  </p>
                  {booking.reason && <p className="mt-1 text-sm text-gray-600">{booking.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={decidingId === booking.id}
                    onClick={() => handleDecide(booking, "approved")}
                    className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium
                      text-green-700 transition-all duration-200 hover:bg-green-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={decidingId === booking.id}
                    onClick={() => handleDecide(booking, "rejected")}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium
                      text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Add a new slot */}
      <form
        onSubmit={handleCreateSlot}
        className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <input
          type="date"
          value={form.date}
          onChange={handleFormChange("date")}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
            focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <input
          type="time"
          value={form.start_time}
          onChange={handleFormChange("start_time")}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
            focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <input
          type="time"
          value={form.end_time}
          onChange={handleFormChange("end_time")}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
            focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
            transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSaving ? "Adding…" : "Add slot"}
        </button>
        {formError && <p className="col-span-full text-sm text-red-600">{formError}</p>}
      </form>

      {/* My slots list */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {slotsStatus === "loading" && (
          <div className="space-y-2 p-4">
            {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        )}
        {slotsStatus === "ready" && slots.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">You haven&apos;t opened any slots yet.</p>
        )}
        {slotsStatus === "ready" && slots.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slots.map((slot) => (
                <tr key={slot.id}>
                  <td className="px-4 py-2.5 text-gray-900">{formatDate(slot.date)}</td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                  </td>
                  <td className="px-4 py-2.5">
                    {slot.is_open ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                        Open
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
                        Booked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-xs font-medium text-gray-400 transition-colors hover:text-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}