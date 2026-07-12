"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { searchApi, type Train, type Station, type Schedule } from "@/lib/api";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"trains" | "stations" | "schedules">("trains");
  const [results, setResults] = useState<{
    trains: Train[];
    stations: Station[];
    schedules: Schedule[];
  }>({ trains: [], stations: [], schedules: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [trains, stations, schedules] = await Promise.all([
          searchApi.trains(query),
          searchApi.stations(query),
          searchApi.schedules(query),
        ]);
        setResults({ trains, stations, schedules });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center px-4 pt-16 pb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Indian Railway Catering & Tourism
        </h1>
        <p className="text-zinc-500 mb-8">
          Search trains, stations, and schedules
        </p>

        <div className="w-full max-w-xl">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by train name, number, station, or city..."
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 pr-10 text-sm outline-none focus:border-zinc-500"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                \u2026
              </span>
            )}
          </div>

          {/* Tabs */}
          {query.trim() && (
            <div className="mt-4 flex gap-1 rounded-lg bg-zinc-100 p-1 text-sm">
              {(["trains", "stations", "schedules"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md py-1.5 font-medium capitalize ${
                    tab === t ? "bg-white shadow-sm" : "text-zinc-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {query.trim() && (
        <section className="flex-1 px-4 pb-16">
          <div className="mx-auto max-w-xl space-y-3">
            {tab === "trains" &&
              (results.trains.length === 0 && !loading ? (
                <p className="text-center text-sm text-zinc-400">
                  No trains found
                </p>
              ) : (
                results.trains.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-zinc-500">{t.number}</p>
                      </div>
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium">
                        {t.coachName}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {t.totalSeats} seats
                    </p>
                  </div>
                ))
              ))}

            {tab === "stations" &&
              (results.stations.length === 0 && !loading ? (
                <p className="text-center text-sm text-zinc-400">
                  No stations found
                </p>
              ) : (
                results.stations.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-sm text-zinc-500">
                          {s.city}, {s.state}
                        </p>
                      </div>
                      <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
                        {s.code}
                      </span>
                    </div>
                  </div>
                ))
              ))}

            {tab === "schedules" &&
              (results.schedules.length === 0 && !loading ? (
                <p className="text-center text-sm text-zinc-400">
                  No schedules found
                </p>
              ) : (
                results.schedules.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{s.train?.name ?? "Train"}</p>
                        <p className="text-sm text-zinc-500">
                          {s.train?.number ?? ""}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {s.journeyDate
                          ? new Date(s.journeyDate).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      <span>Dep: {s.departureTime ?? "\u2014"}</span>
                      <span>Arr: {s.arrivalTime ?? "\u2014"}</span>
                    </div>
                  </div>
                ))
              ))}
          </div>
        </section>
      )}

      {/* CTA for unauthenticated */}
      {!query.trim() && (
        <section className="flex flex-col items-center gap-3 pb-16">
          <p className="text-sm text-zinc-400">
            Sign in to book tickets and manage your profile
          </p>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
            >
              Register
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
