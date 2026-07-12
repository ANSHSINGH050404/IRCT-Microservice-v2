"use client";

import { useEffect, useState, FormEvent } from "react";
import { adminApi, type Schedule, type Train } from "@/lib/api";

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    trainId: "",
    journeyDate: "",
    departureTime: "",
    arrivalTime: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.getSchedules(),
      adminApi.getTrains(),
    ])
      .then(([s, t]) => {
        setSchedules(s);
        setTrains(t);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createSchedule(form);
      setShowForm(false);
      setForm({ trainId: "", journeyDate: "", departureTime: "", arrivalTime: "" });
      const [s, t] = await Promise.all([
        adminApi.getSchedules(),
        adminApi.getTrains(),
      ]);
      setSchedules(s);
      setTrains(t);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {showForm ? "Cancel" : "Add schedule"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="grid grid-cols-5 gap-3">
            <select
              required
              value={form.trainId}
              onChange={(e) => setForm({ ...form, trainId: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              <option value="">Select train</option>
              {trains.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.number})
                </option>
              ))}
            </select>
            <input
              required
              type="date"
              value={form.journeyDate}
              onChange={(e) => setForm({ ...form, journeyDate: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <input
              required
              type="time"
              value={form.departureTime}
              onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <input
              required
              type="time"
              value={form.arrivalTime}
              onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Saving\u2026" : "Save"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading\u2026</p>
      ) : schedules.length === 0 ? (
        <p className="text-sm text-zinc-400">No schedules yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="px-4 py-3 font-medium">Train</th>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Departure</th>
                <th className="px-4 py-3 font-medium">Arrival</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3">{s.train?.name ?? "\u2014"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {s.train?.number ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    {s.journeyDate
                      ? new Date(s.journeyDate).toLocaleDateString()
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{s.departureTime}</td>
                  <td className="px-4 py-3 text-zinc-500">{s.arrivalTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
