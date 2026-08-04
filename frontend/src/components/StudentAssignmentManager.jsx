import { useEffect, useState } from "react";
import { fetchStudentAssignments, assignAdvisor, fetchAdvisors } from "../api/advisingApi";

export default function StudentAssignmentManager() {
  const [students, setStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => {
    Promise.all([fetchStudentAssignments(), fetchAdvisors()])
      .then(([studentData, advisorData]) => {
        setStudents(studentData);
        setAdvisors(advisorData);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAssign = async (studentId, advisorIdRaw) => {
    const advisorId = advisorIdRaw === "" ? null : Number(advisorIdRaw);
    setSavingId(studentId);
    try {
      const updated = await assignAdvisor(studentId, advisorId);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    } catch {
      // leave the row as-is; admin can retry
    } finally {
      setSavingId(null);
    }
  };

  const visibleStudents = students.filter(
    (s) =>
      !search ||
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );
  const unassignedCount = students.filter((s) => !s.advisor).length;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Advisor Assignments</h2>
          <p className="mt-1 text-sm text-gray-500">
            Only a student&apos;s assigned advisor can see their risk score and alerts.
            {status === "ready" && unassignedCount > 0 && (
              <span className="ml-1 font-medium text-amber-600">{unassignedCount} unassigned.</span>
            )}
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students…"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900
            placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {status === "loading" && (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        )}

        {status === "error" && (
          <p className="p-6 text-center text-sm text-red-600">Couldn&apos;t load students right now.</p>
        )}

        {status === "ready" && visibleStudents.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No students match your search.</p>
        )}

        {status === "ready" && visibleStudents.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Student</th>
                <th className="px-4 py-2.5 font-medium">Major</th>
                <th className="px-4 py-2.5 font-medium">Assigned advisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleStudents.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900">{s.username}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{s.major || "—"}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={s.advisor ?? ""}
                      onChange={(e) => handleAssign(s.id, e.target.value)}
                      disabled={savingId === s.id}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900
                        focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {advisors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.username}
                        </option>
                      ))}
                    </select>
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