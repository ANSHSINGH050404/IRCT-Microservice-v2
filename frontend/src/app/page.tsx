"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { adminApi, bookingApi, type Journey, type Station } from "@/lib/api";

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatMoney(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

export default function HomePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromStationId, setFromStationId] = useState("");
  const [toStationId, setToStationId] = useState("");
  const [journeyDate, setJourneyDate] = useState(tomorrow);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getStations()
      .then(setStations)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingStations(false));
  }, []);

  const selectedFrom = useMemo(() => stations.find((station) => station.id === fromStationId), [stations, fromStationId]);
  const selectedTo = useMemo(() => stations.find((station) => station.id === toStationId), [stations, toStationId]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!fromStationId || !toStationId || !journeyDate) {
      setError("Choose your departure, destination, and date first.");
      return;
    }
    if (fromStationId === toStationId) {
      setError("Departure and destination must be different.");
      return;
    }
    setSearching(true);
    setError("");
    try {
      const result = await bookingApi.journeys({ fromStationId, toStationId, journeyDate });
      setJourneys(result.journeys);
    } catch (reason) {
      setJourneys([]);
      setError((reason as Error).message);
    } finally {
      setSearching(false);
    }
  }

  function swapStations() {
    setFromStationId(toStationId);
    setToStationId(fromStationId);
  }

  return (
    <main className="flex-1 overflow-hidden bg-[#f7f7fb]">
      <section className="relative isolate overflow-hidden bg-[#10002b] px-5 pb-28 pt-16 text-white sm:px-8 sm:pt-24">
        <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-fuchsia-500/40 blur-3xl" />
        <div className="pointer-events-none absolute right-[-6rem] top-[-4rem] h-80 w-80 rounded-full bg-cyan-400/35 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-cyan-200">
            RAIL, REMIXED <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
          </p>
          <h1 className="max-w-3xl text-5xl font-black tracking-[-0.07em] sm:text-7xl">
            Your next city is <span className="text-transparent [-webkit-text-stroke:1px_#a5f3fc]">one train</span> away.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-violet-100 sm:text-lg">
            Find a seat, bring your people, and keep the journey moving. No queues. No chaos.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-5 pb-20 sm:px-8">
        <form onSubmit={handleSearch} className="rounded-[2rem] border border-violet-100 bg-white p-5 shadow-[0_20px_60px_rgba(31,10,74,0.16)] sm:p-7">
          <div className="grid gap-4 lg:grid-cols-[1fr_44px_1fr_0.72fr_auto] lg:items-end">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Leaving from
              <select value={fromStationId} onChange={(event) => setFromStationId(event.target.value)} disabled={loadingStations} className="h-13 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-medium outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:opacity-60">
                <option value="">Select station</option>
                {stations.map((station) => <option key={station.id} value={station.id}>{station.name} ({station.code})</option>)}
              </select>
            </label>
            <button type="button" onClick={swapStations} aria-label="Swap departure and destination" className="hidden h-11 w-11 rounded-full border border-violet-200 bg-violet-50 text-lg text-violet-700 transition hover:rotate-180 hover:bg-violet-100 lg:grid lg:place-items-center">↔</button>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Going to
              <select value={toStationId} onChange={(event) => setToStationId(event.target.value)} disabled={loadingStations} className="h-13 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-medium outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:opacity-60">
                <option value="">Select station</option>
                {stations.map((station) => <option key={station.id} value={station.id}>{station.name} ({station.code})</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Journey date
              <input type="date" value={journeyDate} min={tomorrow()} onChange={(event) => setJourneyDate(event.target.value)} className="h-13 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-medium outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
            </label>
            <button type="submit" disabled={searching || loadingStations} className="h-13 rounded-2xl bg-[#5b21b6] px-7 font-bold text-white shadow-lg shadow-violet-300/60 transition hover:-translate-y-0.5 hover:bg-[#4c1d95] disabled:cursor-not-allowed disabled:opacity-60">
              {searching ? "Finding rides…" : "Find trains"}
            </button>
          </div>
          {error && <p aria-live="polite" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
          {selectedFrom && selectedTo && <p className="mt-4 text-sm text-slate-500">Searching <strong className="text-slate-700">{selectedFrom.city}</strong> to <strong className="text-slate-700">{selectedTo.city}</strong> on {new Date(`${journeyDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.</p>}
        </form>

        <div className="mt-14 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-600">Live availability</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">{journeys.length ? "Pick your ride" : "Made for spontaneous plans."}</h2>
          </div>
          {journeys.length > 0 && <p className="rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-lime-800">{journeys.length} trains found</p>}
        </div>

        {journeys.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {journeys.map((journey) => (
              <article key={journey.id} className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100 sm:p-6">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">{journey.train.number}</span><span className="font-bold text-slate-900">{journey.train.name}</span></div>
                    <div className="mt-4 flex items-center gap-3 text-slate-900"><div><p className="text-xl font-black">{formatTime(journey.departureTime)}</p><p className="text-sm text-slate-500">{journey.fromStation.code}</p></div><div className="flex min-w-24 flex-1 items-center gap-1 text-violet-400"><span className="h-px flex-1 bg-violet-200" />✦<span className="h-px flex-1 bg-violet-200" /></div><div><p className="text-xl font-black">{formatTime(journey.arrivalTime)}</p><p className="text-sm text-slate-500">{journey.toStation.code}</p></div></div>
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end"><p className="text-sm text-slate-500">from <strong className="text-slate-900">{formatMoney(journey.fares[0] ?? 0)}</strong> · <span className="font-bold text-emerald-600">{journey.availableSeatCount} seats left</span></p><Link href={`/book/${journey.id}?fromStationId=${fromStationId}&toStationId=${toStationId}`} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition group-hover:bg-fuchsia-600">Choose seats →</Link></div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-violet-200 bg-violet-50/60 p-7 text-slate-600"><p className="text-lg font-bold text-slate-900">Start with a route.</p><p className="mt-1 text-sm">We’ll show only trains travelling in the right direction, on your chosen day.</p></div>
        )}
      </section>
    </main>
  );
}
