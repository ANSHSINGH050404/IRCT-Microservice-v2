"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingApi, getAccessToken, type Booking } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!getAccessToken()) { router.replace("/login"); return; }
    bookingApi.myBookings().then(({ bookings: value }) => setBookings(value)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [router]);
  return <main className="min-h-[calc(100vh-3.5rem)] bg-[#f7f7fb] px-5 py-10 sm:px-8"><div className="mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">Your travel log</p><h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">Booked & ready.</h1>{error && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}{loading ? <p className="mt-8 text-sm font-bold text-slate-500">Loading your bookings…</p> : bookings.length === 0 ? <div className="mt-7 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><p className="font-black text-slate-900">No tickets yet.</p><Link href="/" className="mt-3 inline-block font-bold text-violet-700">Find your first train →</Link></div> : <div className="mt-7 grid gap-4">{bookings.map((booking) => <Link key={booking.id} href={`/tickets/${booking.pnr}`} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">PNR {booking.pnr}</p><p className="mt-2 text-lg font-black text-slate-950">{booking.journey.train.name} · {booking.journey.train.number}</p><p className="mt-1 text-sm text-slate-500">{booking.journey.fromStation.code} → {booking.journey.toStation.code} · {new Date(booking.journey.journeyDate).toLocaleDateString("en-IN")}</p></div><span className={`h-fit rounded-full px-3 py-1 text-sm font-bold ${booking.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{booking.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}</span></div></Link>)}</div>}</div></main>;
}
