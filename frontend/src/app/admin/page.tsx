"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ stations: 0, trains: 0, routes: 0, schedules: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.getStations(),
      adminApi.getTrains(),
      adminApi.getRoutes(),
      adminApi.getSchedules(),
    ])
      .then(([stations, trains, routes, schedules]) => {
        setCounts({
          stations: stations.length,
          trains: trains.length,
          routes: routes.length,
          schedules: schedules.length,
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  const cards = [
    { label: "Stations", count: counts.stations, href: "/admin/stations" },
    { label: "Trains", count: counts.trains, href: "/admin/trains" },
    { label: "Routes", count: counts.routes, href: "/admin/routes" },
    { label: "Schedules", count: counts.schedules, href: "/admin/schedules" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 hover:shadow-sm"
          >
            <p className="text-3xl font-bold">{card.count}</p>
            <p className="mt-1 text-sm text-zinc-500">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
