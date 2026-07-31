import { useEffect, useState } from "react";
import {
  fetchFinancialAidItems, createFinancialAidItem, updateFinancialAidItem, deleteFinancialAidItem,
  fetchEventItems, createEventItem, updateEventItem, deleteEventItem,
} from "../api/dashboardApi";

const EMPTY_AID = { title: "", amount: "", deadline: "", description: "", eligible_majors: "", eligible_years: "", min_gpa: "" };
const EMPTY_EVENT = { title: "", location: "", date: "", description: "", eligible_majors: "", eligible_years: "" };

// "Computer Science, Software Engineering" -> ["Computer Science", "Software Engineering"]
function toList(text) {
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}
function toText(list) {
  return Array.isArray(list) ? list.join(", ") : "";
}

export default function OpportunityManager() {
  const [tab, setTab] = useState("aid"); // "aid" | "events"
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [form, setForm] = useState(EMPTY_AID);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAid = tab === "aid";

  const fetchItems = () => {
    const fetcher = isAid ? fetchFinancialAidItems : fetchEventItems;
    fetcher()
      .then((data) => {
        setItems(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  const load = () => {
    setStatus("loading");
    fetchItems();
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleTabChange = (key) => {
    setStatus("loading");
    setTab(key);
    setShowForm(false);
    setEditingId(null);
    setForm(key === "aid" ? EMPTY_AID : EMPTY_EVENT);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(isAid ? EMPTY_AID : EMPTY_EVENT);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setError("");
    if (isAid) {
      setForm({
        title: item.title,
        amount: item.amount ?? "",
        deadline: item.deadline ?? "",
        description: item.description ?? "",
        eligible_majors: toText(item.eligible_majors),
        eligible_years: toText(item.eligible_years),
        min_gpa: item.min_gpa ?? "",
      });
    } else {
      setForm({
        title: item.title,
        location: item.location ?? "",
        date: item.date ? item.date.slice(0, 16) : "",
        description: item.description ?? "",
        eligible_majors: toText(item.eligible_majors),
        eligible_years: toText(item.eligible_years),
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      description: form.description,
      eligible_majors: toList(form.eligible_majors),
      eligible_years: toList(form.eligible_years),
      ...(isAid
        ? {
            amount: form.amount || null,
            deadline: form.deadline || null,
            min_gpa: form.min_gpa || null,
          }
        : {
            location: form.location,
            date: form.date ? new Date(form.date).toISOString() : null,
          }),
    };

    try {
      if (editingId) {
        const updater = isAid ? updateFinancialAidItem : updateEventItem;
        await updater(editingId, payload);
      } else {
        const creator = isAid ? createFinancialAidItem : createEventItem;
        await creator(payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't save. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item? This can't be undone.")) return;
    try {
      const remover = isAid ? deleteFinancialAidItem : deleteEventItem;
      await remover(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert("Couldn't delete this item right now.");
    }
  };

  return (
    <section className="mt-10 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Manage opportunities</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {[{ key: "aid", label: "Financial Aid" }, { key: "events", label: "Events" }].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTabChange(t.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  tab === t.key ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white
              transition-all duration-200 hover:bg-green-700 active:scale-[0.98]"
          >
            + Add new
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-in"
        >
          <p className="text-sm font-medium text-gray-900">
            {editingId ? "Edit" : "New"} {isAid ? "financial aid item" : "event"}
          </p>

          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
          />

          {isAid ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="number" step="0.01" placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
              <input
                type="date" placeholder="Deadline"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
              <input
                type="number" step="0.01" min="0" max="4" placeholder="Min GPA (e.g. 3.50)"
                value={form.min_gpa}
                onChange={(e) => setForm({ ...form, min_gpa: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Eligible majors (comma-separated, blank = open to all)"
              value={form.eligible_majors}
              onChange={(e) => setForm({ ...form, eligible_majors: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
            />
            <input
              placeholder="Eligible years (comma-separated, blank = open to all)"
              value={form.eligible_years}
              onChange={(e) => setForm({ ...form, eligible_years: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
            />
          </div>

          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white
                transition-all duration-200 hover:bg-green-700 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {status === "loading" && (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        )}

        {status === "error" && (
          <p className="p-6 text-center text-sm text-red-600">Couldn&apos;t load items right now.</p>
        )}

        {status === "ready" && items.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No {isAid ? "financial aid items" : "events"} yet — add one above.</p>
        )}

        {status === "ready" && items.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">{isAid ? "Amount" : "Location"}</th>
                <th className="px-4 py-3 font-medium">{isAid ? "Deadline" : "Date"}</th>
                <th className="px-4 py-3 font-medium">Eligibility</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-green-50/40">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {isAid ? (item.amount ? `৳${Number(item.amount).toLocaleString()}` : "—") : item.location || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {isAid ? (item.deadline || "—") : new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {(item.eligible_majors?.length || item.eligible_years?.length)
                      ? [...(item.eligible_majors || []), ...(item.eligible_years || [])].join(", ")
                      : "Open to all"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      className="mr-2 text-xs font-medium text-green-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
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