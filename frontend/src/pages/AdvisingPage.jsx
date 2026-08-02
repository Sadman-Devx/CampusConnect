import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdvisors, fetchOpenSlots, fetchMyBookings,
  requestBooking, cancelBooking,
} from "../api/advisingApi";
import { AlertStatusBadge } from "../components/AlertBadges";

function formatDate(value) {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(value) {
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function AdvisingPage() {
  const [advisors, setAdvisors] = useState([]);
  const [advisorsStatus, setAdvisorsStatus] = useState("loading");
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(null);

  const [slots, setSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState("idle"); // idle | loading | ready | error
  const [requestingSlotId, setRequestingSlotId] = useState(null);
  const [reasonDrafts, setReasonDrafts] = useState({});
  const [requestError, setRequestError] = useState("");

  const [bookings, setBookings] = useState([]);
  const [bookingsStatus, setBookingsStatus] = useState("loading");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAdvisors()
      .then((data) => {
        setAdvisors(data);
        setAdvisorsStatus("ready");
      })
      .catch(() => setAdvisorsStatus("error"));
  }, []);

  const loadBookings = () => {
    fetchMyBookings()
      .then((data) => {
        setBookings(data);
        setBookingsStatus("ready");
      })
      .catch(() => setBookingsStatus("error"));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleSelectAdvisor = (advisorId) => {
    setSelectedAdvisorId(advisorId);
    setSlotsStatus("loading");
    setRequestError("");
    fetchOpenSlots(advisorId)
      .then((data) => {
        setSlots(data);
        setSlotsStatus("ready");
      })
      .catch(() => setSlotsStatus("error"));
  };

  const handleRequest = async (slotId) => {
    setRequestingSlotId(slotId);
    setRequestError("");
    try {
      await requestBooking({ slotId, reason: reasonDrafts[slotId] || "" });
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      loadBookings();
    } catch (err) {
      setRequestError(
        err.response?.data?.slot?.[0] || "Couldn't send that request. It may no longer be open."
      );
    } finally {
      setRequestingSlotId(null);
    }
  };

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      loadBookings();
    } catch {
      // leave as-is, advisor can retry
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 animate-fade-up">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mt-5 text-2xl font-semibold text-gray-900">Book an Advisor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick an advisor, choose an open time, and send a request. It's confirmed once they approve it.
        </p>

        {/* Advisor picker */}
        <div className="mt-6 flex flex-wrap gap-2">
          {advisorsStatus === "loading" &&
            [1, 2, 3].map((i) => <div key={i} className="h-9 w-32 animate-pulse rounded-lg bg-gray-100" />)}

          {advisorsStatus === "error" && (
            <p className="text-sm text-red-600">Couldn&apos;t load advisors right now.</p>
          )}

          {advisorsStatus === "ready" && advisors.length === 0 && (
            <p className="text-sm text-gray-500">No advisors are set up yet.</p>
          )}

          {advisorsStatus === "ready" &&
            advisors.map((advisor) => (
              <button
                key={advisor.id}
                type="button"
                onClick={() => handleSelectAdvisor(advisor.id)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  selectedAdvisorId === advisor.id
                    ? "border-green-600 bg-green-600 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                {advisor.username}
                <span
                  className={`ml-2 text-xs ${selectedAdvisorId === advisor.id ? "text-green-100" : "text-gray-400"}`}
                >
                  {advisor.open_slot_count} open
                </span>
              </button>
            ))}
        </div>

        {/* Open slots for the selected advisor */}
        {selectedAdvisorId && (
          <div className="mt-4">
            {slotsStatus === "loading" && (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />)}
              </div>
            )}

            {slotsStatus === "error" && (
              <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                Couldn&apos;t load open slots right now.
              </p>
            )}

            {slotsStatus === "ready" && slots.length === 0 && (
              <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                No open slots for this advisor right now.
              </p>
            )}

            {requestError && <p className="mb-2 text-sm text-red-600">{requestError}</p>}

            {slotsStatus === "ready" && slots.length > 0 && (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border
                      border-gray-200 bg-white p-4 shadow-sm animate-fade-in"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(slot.date)} · {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                      </p>
                      <input
                        type="text"
                        value={reasonDrafts[slot.id] || ""}
                        onChange={(e) =>
                          setReasonDrafts((prev) => ({ ...prev, [slot.id]: e.target.value }))
                        }
                        placeholder="What do you want to discuss? (optional)"
                        className="mt-1.5 w-64 rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-900
                          placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={requestingSlotId === slot.id}
                      onClick={() => handleRequest(slot.id)}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
                        transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {requestingSlotId === slot.id ? "Sending…" : "Request"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My appointment requests */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">My Appointments</h2>
          <div className="mt-3 space-y-2">
            {bookingsStatus === "loading" &&
              [1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}

            {bookingsStatus === "error" && (
              <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                Couldn&apos;t load your appointments right now.
              </p>
            )}

            {bookingsStatus === "ready" && bookings.length === 0 && (
              <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                You haven&apos;t requested any appointments yet.
              </p>
            )}

            {bookingsStatus === "ready" &&
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border
                    border-gray-200 bg-white p-4 shadow-sm animate-fade-in"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{booking.advisor_username}</p>
                      <AlertStatusBadge status={booking.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatDate(booking.slot_date)} · {formatTime(booking.slot_start_time)}–{formatTime(booking.slot_end_time)}
                    </p>
                    {booking.advisor_note && (
                      <p className="mt-1 text-sm text-gray-600">Note: {booking.advisor_note}</p>
                    )}
                  </div>
                  {(booking.status === "pending" || booking.status === "approved") && (
                    <button
                      type="button"
                      disabled={cancellingId === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600
                        transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}