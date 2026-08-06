import { useMemo, useState } from "react";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Local-date key (NOT toISOString, which shifts a day in UTC+ timezones
// like Dhaka once local midnight crosses back over into the previous UTC day).
function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(value) {
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function AdvisorCalendarView({ slots }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const byDate = useMemo(() => {
    const map = {};
    for (const slot of slots) {
      (map[slot.date] ||= []).push(slot);
    }
    return map;
  }, [slots]);

  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    const result = [];
    for (let w = 0; w < 8; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + w * 7 + d);
        week.push(day);
      }
      result.push(week);
    }
    return result;
  }, []);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const selectedSlots = selectedDate ? byDate[selectedDate] || [] : [];

  return (
    <div className="mt-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid min-w-[560px] grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-gray-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="mt-1 space-y-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid min-w-[560px] grid-cols-7 gap-1.5">
              {week.map((day) => {
                const key = toDateKey(day);
                const daySlots = byDate[key] || [];
                const isPast = day < todayStart;
                const isSelected = selectedDate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isPast}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={`flex h-16 flex-col items-center justify-start rounded-lg border p-1 text-xs transition-all duration-150 ${
                      isPast
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                        : isSelected
                        ? "border-green-600 bg-green-50 shadow-sm"
                        : daySlots.length > 0
                        ? "border-green-200 bg-green-50/40 hover:border-green-400"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold text-gray-700">{day.getDate()}</span>
                    {daySlots.length > 0 && (
                      <span className="mt-0.5 rounded-full bg-green-600 px-1.5 text-[10px] font-medium text-white">
                        {daySlots.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
              weekday: "long", month: "long", day: "numeric",
            })}
          </p>
          {selectedSlots.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">No slots on this day.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {selectedSlots.map((slot) => (
                <li key={slot.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      slot.is_open ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {slot.is_open ? "Open" : "Booked"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}