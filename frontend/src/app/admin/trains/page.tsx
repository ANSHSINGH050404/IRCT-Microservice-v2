"use client";

import { useEffect, useState, FormEvent } from "react";
import { adminApi, type Train } from "@/lib/api";

export default function AdminTrainsPage() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", number: "", coachName: "AC", totalSeats: 100 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .getTrains()
      .then(setTrains)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createTrain(form);
      setShowForm(false);
      setForm({ name: "", number: "", coachName: "AC", totalSeats: 100 });
      const data = await adminApi.getTrains();
      setTrains(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trains</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {showForm ? "Cancel" : "Add train"}
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
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <input
              required
              placeholder="Number"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <select
              value={form.coachName}
              onChange={(e) => setForm({ ...form, coachName: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              <option value="AC">AC</option>
              <option value="Sleeper">Sleeper</option>
              <option value="Seater">Seater</option>
            </select>
            <input
              required
              type="number"
              min={1}
              placeholder="Total seats"
              value={form.totalSeats}
              onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })}
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
      ) : trains.length === 0 ? (
        <p className="text-sm text-zinc-400">No trains yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Coach</th>
                <th className="px-4 py-3 font-medium">Seats</th>
              </tr>
            </thead>
            <tbody>
              {trains.map((t) => (
                <tr key={t.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    {t.number}
                  </td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{t.coachName}</td>
                  <td className="px-4 py-3 text-zinc-500">{t.totalSeats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
