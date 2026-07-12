"use client";

import { useEffect, useState, FormEvent } from "react";
import { adminApi, type Route, type Station, type Train } from "@/lib/api";

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    trainId: string;
    stations: { stationId: string; stopNumber: number; arrivalTime: string; departureTime: string }[];
  }>({ trainId: "", stations: [{ stationId: "", stopNumber: 1, arrivalTime: "", departureTime: "" }] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.getRoutes(),
      adminApi.getStations(),
      adminApi.getTrains(),
    ])
      .then(([r, s, t]) => {
        setRoutes(r);
        setStations(s);
        setTrains(t);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function addStation() {
    setForm((prev) => ({
      ...prev,
      stations: [
        ...prev.stations,
        {
          stationId: "",
          stopNumber: prev.stations.length + 1,
          arrivalTime: "",
          departureTime: "",
        },
      ],
    }));
  }

  function updateStation(index: number, field: string, value: string | number) {
    setForm((prev) => {
      const stations = [...prev.stations];
      stations[index] = { ...stations[index], [field]: value };
      return { ...prev, stations };
    });
  }

  function removeStation(index: number) {
    setForm((prev) => {
      const stations = prev.stations
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stopNumber: i + 1 }));
      return { ...prev, stations };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createRoute({
        trainId: form.trainId,
        stations: form.stations.map((s) => ({
          stationId: s.stationId,
          stopNumber: s.stopNumber,
          arrivalTime: s.arrivalTime || undefined,
          departureTime: s.departureTime || undefined,
        })),
      });
      setShowForm(false);
      setForm({ trainId: "", stations: [{ stationId: "", stopNumber: 1, arrivalTime: "", departureTime: "" }] });
      const [r, s, t] = await Promise.all([
        adminApi.getRoutes(),
        adminApi.getStations(),
        adminApi.getTrains(),
      ]);
      setRoutes(r);
      setStations(s);
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
        <h1 className="text-2xl font-bold">Routes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {showForm ? "Cancel" : "Add route"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Train</label>
            <select
              required
              value={form.trainId}
              onChange={(e) => setForm({ ...form, trainId: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              <option value="">Select a train</option>
              {trains.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.number})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Stations</label>
              <button
                type="button"
                onClick={addStation}
                className="text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                + Add station
              </button>
            </div>
            {form.stations.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 w-4">{s.stopNumber}.</span>
                <select
                  required
                  value={s.stationId}
                  onChange={(e) => updateStation(i, "stationId", e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                >
                  <option value="">Station</option>
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={s.arrivalTime}
                  onChange={(e) => updateStation(i, "arrivalTime", e.target.value)}
                  className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  placeholder="Arrival"
                />
                <input
                  type="time"
                  value={s.departureTime}
                  onChange={(e) => updateStation(i, "departureTime", e.target.value)}
                  className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  placeholder="Departure"
                />
                {form.stations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStation(i)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving\u2026" : "Save"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading\u2026</p>
      ) : routes.length === 0 ? (
        <p className="text-sm text-zinc-400">No routes yet</p>
      ) : (
        <div className="space-y-4">
          {routes.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <p className="font-semibold mb-2">
                {r.train?.name ?? "Unknown"} ({r.train?.number ?? ""})
              </p>
              <div className="space-y-1">
                {r.routeStations
                  .sort((a, b) => a.stopNumber - b.stopNumber)
                  .map((rs) => (
                    <div
                      key={rs.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-xs text-zinc-400 w-4">
                        {rs.stopNumber}.
                      </span>
                      <span className="font-medium">
                        {rs.station?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        ({rs.station?.code ?? ""})
                      </span>
                      {rs.arrivalTime && (
                        <span className="text-xs text-zinc-500 ml-auto">
                          Arr: {rs.arrivalTime}
                        </span>
                      )}
                      {rs.departureTime && (
                        <span className="text-xs text-zinc-500">
                          Dep: {rs.departureTime}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
