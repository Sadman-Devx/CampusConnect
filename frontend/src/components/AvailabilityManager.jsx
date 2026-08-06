import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchMySlots, createSlot, deleteSlot,
  fetchPendingBookings, decideBooking,
  fetchRecurringRules, createRecurringRule, deleteRecurringRule,
  fetchPendingBookingCount, proposeReschedule,
} from "../api/advisingApi";
import AdvisorCalendarView from "./AdvisorCalendarView";

const EMPTY_SLOT = { date: "", start_time: "", end_time: "" };
const EMPTY_RULE = { weekday: "0", start_time: "", end_time: "", effective_until: "" };
const WEEKDAY_OPTIONS = [
  { value: "0", label: "Monday" }, { value: "1", label: "Tuesday" },
  { value: "2", label: "Wednesday" }, { value: "3", label: "Thursday" },
  { value: "4", label: "Friday" }, { value: "5", label: "Saturday" },
  { value: "6", label: "Sunday" },
];
const PENDING_POLL_MS = 20000;

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

function academicLine(booking) {
  const parts = [];
  if (booking.student_major) parts.push(booking.student_major);
  if (booking.student_academic_year) parts.push(booking.student_academic_year);
  if (booking.student_gpa != null) {
    parts.push(`GPA ${booking.student_gpa}${booking.student_gpa_verified ? " ✓" : ""}`);
  }
  return parts.join(" · ");
}

export default function AvailabilityManager() {
  const { user } = useAuth();
  const lastSeenKey = `advising_last_seen_request_${user?.id ?? "anon"}`;

  const [slots, setSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState("loading");
  const [slotsView, setSlotsView] = useState("list"); // list | calendar
  const [form, setForm] = useState(EMPTY_SLOT);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [rules, setRules] = useState([]);
  const [rulesStatus, setRulesStatus] = useState("loading");
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);
  const [ruleError, setRuleError] = useState("");
  const [isSavingRule, setIsSavingRule] = useState(false);

  const [pending, setPending] = useState([]);
  const [pendingStatus, setPendingStatus] = useState("loading");
  const [decidingId, setDecidingId] = useState(null);
  const [proposingId, setProposingId] = useState(null);
  const [proposalDraft, setProposalDraft] = useState({});

  const [newRequestBanner, setNewRequestBanner] = useState(false);

  const loadSlots = () => {
    fetchMySlots()
      .then((data) => {
        setSlots(data);
        setSlotsStatus("ready");
      })
      .catch(() => setSlotsStatus("error"));
  };

  const loadRules = () => {
    fetchRecurringRules()
      .then((data) => {
        setRules(data);
        setRulesStatus("ready");
      })
      .catch(() => setRulesStatus("error"));
  };

  const loadPending = () => {
    fetchPendingBookings()
      .then((data) => {
        setPending(data);
        setPendingStatus("ready");
        localStorage.setItem(lastSeenKey, new Date().toISOString());
        setNewRequestBanner(false);
      })
      .catch(() => setPendingStatus("error"));
  };

  useEffect(() => {
    loadSlots();
    loadRules();
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Advisor-side gap fix: no more manual refresh to find new requests --
  // poll the cheap count endpoint and surface a banner the moment it
  // changes, without re-fetching the full list every tick.
  useEffect(() => {
    const interval = setInterval(() => {
      const lastSeen = localStorage.getItem(lastSeenKey);
      fetchPendingBookingCount()
        .then(({ latest_requested_at }) => {
          if (latest_requested_at && (!lastSeen || new Date(latest_requested_at) > new Date(lastSeen))) {
            setNewRequestBanner(true);
          }
        })
        .catch(() => {});
    }, PENDING_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setSlotsStatus("loading");
      loadSlots();
    }
  };

  const handleRuleFormChange = (field) => (e) => {
    setRuleForm((f) => ({ ...f, [field]: e.target.value }));
    setRuleError("");
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setIsSavingRule(true);
    setRuleError("");
    try {
      await createRecurringRule({
        weekday: Number(ruleForm.weekday),
        start_time: ruleForm.start_time,
        end_time: ruleForm.end_time,
        effective_until: ruleForm.effective_until || null,
      });
      setRuleForm(EMPTY_RULE);
      setRulesStatus("loading");
      loadRules();
      setSlotsStatus("loading");
      loadSlots();
    } catch (err) {
      setRuleError(
        err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.detail ||
          "Couldn't save that rule. Check the times."
      );
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await deleteRecurringRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {
      setRulesStatus("loading");
      loadRules();
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

  const handleProposeReschedule = async (booking) => {
    const proposedSlotId = proposalDraft[booking.id];
    if (!proposedSlotId) return;
    setProposingId(booking.id);
    try {
      await proposeReschedule(booking.id, { proposed_slot: proposedSlotId });
      setPending((prev) => prev.filter((b) => b.id !== booking.id));
    } catch {
      // leave the row as-is; advisor can retry
    } finally {
      setProposingId(null);
    }
  };

  const ownOpenSlotsFor = (booking) => slots.filter((s) => s.is_open && s.id !== booking.slot);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900">Advising Appointments</h2>
      <p className="mt-1 text-sm text-gray-500">
        Open time slots for students to book, and requests waiting on your decision.
      </p>

      {newRequestBanner && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800 animate-fade-in">
          <span>A new booking request just came in.</span>
          <button
            type="button"
            onClick={() => {
              setPendingStatus("loading");
              loadPending();
            }}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
          >
            Show it
          </button>
        </div>
      )}

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
            pending.map((booking) => {
              const candidates = ownOpenSlotsFor(booking);
              return (
                <div
                  key={booking.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-in"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.student_username}</p>
                      {academicLine(booking) && (
                        <p className="text-xs text-gray-500">{academicLine(booking)}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(booking.slot_date)} · {formatTime(booking.slot_start_time)}–{formatTime(booking.slot_end_time)}
                      </p>
                      {booking.reason && <p className="mt-1 text-sm text-gray-600">{booking.reason}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
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

                  {candidates.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                      <select
                        value={proposalDraft[booking.id] || ""}
                        onChange={(e) =>
                          setProposalDraft((prev) => ({ ...prev, [booking.id]: e.target.value }))
                        }
                        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700
                          focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">Propose a different time…</option>
                        {candidates.map((s) => (
                          <option key={s.id} value={s.id}>
                            {formatDate(s.date)} · {formatTime(s.start_time)}–{formatTime(s.end_time)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!proposalDraft[booking.id] || proposingId === booking.id}
                        onClick={() => handleProposeReschedule(booking)}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium
                          text-amber-700 transition-all duration-200 hover:bg-amber-100 active:scale-[0.98] disabled:opacity-50"
                      >
                        {proposingId === booking.id ? "Sending…" : "Send proposal"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Recurring availability rules */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-800">Recurring availability</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          e.g. "every Monday 2–4 PM" — slots are generated automatically ~8 weeks ahead.
        </p>

        <form
          onSubmit={handleCreateRule}
          className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-5"
        >
          <select
            value={ruleForm.weekday}
            onChange={handleRuleFormChange("weekday")}
            className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-900
              focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            {WEEKDAY_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
          <input
            type="time"
            value={ruleForm.start_time}
            onChange={handleRuleFormChange("start_time")}
            required
            className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-900
              focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <input
            type="time"
            value={ruleForm.end_time}
            onChange={handleRuleFormChange("end_time")}
            required
            className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-900
              focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <input
            type="date"
            value={ruleForm.effective_until}
            onChange={handleRuleFormChange("effective_until")}
            className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-900
              focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={isSavingRule}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white
              transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSavingRule ? "Saving…" : "Add rule"}
          </button>
          {ruleError && <p className="col-span-full text-sm text-red-600">{ruleError}</p>}
        </form>

        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {rulesStatus === "loading" && (
            <div className="space-y-2 p-4">
              <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
            </div>
          )}
          {rulesStatus === "ready" && rules.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No recurring rules set up yet.</p>
          )}
          {rulesStatus === "ready" && rules.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {rules.map((rule) => (
                <li key={rule.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-800">
                    Every {rule.weekday_display} · {formatTime(rule.start_time)}–{formatTime(rule.end_time)}
                    {rule.effective_until && ` (until ${formatDate(rule.effective_until)})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-xs font-medium text-gray-400 transition-colors hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add a one-off slot */}
      <form
        onSubmit={handleCreateSlot}
        className="mt-8 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto]"
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
          {isSaving ? "Adding…" : "Add one-off slot"}
        </button>
        {formError && <p className="col-span-full text-sm text-red-600">{formError}</p>}
      </form>

      {/* My slots -- list / calendar toggle */}
      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">My slots</h3>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {[
            { key: "list", label: "List" },
            { key: "calendar", label: "Calendar" },
          ].map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setSlotsView(v.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all duration-200 ${
                slotsView === v.key ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {slotsView === "calendar" ? (
        <AdvisorCalendarView slots={slots} />
      ) : (
        <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
      )}
    </section>
  );
}