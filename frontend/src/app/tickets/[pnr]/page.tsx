"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bookingApi, getAccessToken, type Booking } from "@/lib/api";

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export default function TicketPage() {
  const { pnr } = useParams<{ pnr: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    bookingApi.ticket(pnr).then(({ booking: value }) => setBooking(value)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [pnr, router]);

  async function cancel() {
    if (!booking || !window.confirm("Cancel this entire booking and issue a full refund?")) return;
    setCancelling(true);
    setError("");
    try {
      const result = await bookingApi.cancel(booking.pnr!);
      setBooking(result.booking);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <main className="grid min-h-[70vh] place-items-center bg-[#f7f7fb] text-sm font-bold text-slate-500">Loading your ticket…</main>;
  if (!booking) return <main className="grid min-h-[70vh] place-items-center bg-[#f7f7fb] p-5"><div className="rounded-3xl bg-white p-8 text-center shadow-sm"><p className="font-black text-slate-900">Ticket unavailable</p><p className="mt-2 text-sm text-slate-500">{error || "We couldn’t find that PNR."}</p><Link href="/bookings" className="mt-5 inline-block font-bold text-violet-700">View bookings</Link></div></main>;

  const cancelled = booking.status === "CANCELLED";
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f7f7fb] px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-violet-100/70 ring-1 ring-slate-200">
        <header className={`p-7 text-white sm:p-9 ${cancelled ? "bg-slate-700" : "bg-gradient-to-br from-violet-800 via-[#5b21b6] to-fuchsia-600"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">{cancelled ? "Ticket cancelled" : "Boarding pass"}</p><h1 className="mt-2 text-4xl font-black tracking-[-0.06em]">{booking.pnr}</h1></div><span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{cancelled ? "Refund initiated" : "Confirmed"}</span></div>
          <div className="mt-9 flex items-center justify-between gap-4"><div><p className="text-2xl font-black">{booking.journey.fromStation.code}</p><p className="text-sm text-white/70">{booking.journey.fromStation.name}</p></div><div className="flex flex-1 items-center gap-2 text-center text-white/80"><span className="h-px flex-1 bg-white/30" />✦<span className="h-px flex-1 bg-white/30" /></div><div className="text-right"><p className="text-2xl font-black">{booking.journey.toStation.code}</p><p className="text-sm text-white/70">{booking.journey.toStation.name}</p></div></div>
        </header>
        <div className="p-7 sm:p-9"><div className="grid gap-5 border-b border-dashed border-slate-300 pb-7 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Train</p><p className="mt-1 font-black text-slate-900">{booking.journey.train.name}</p><p className="text-sm text-slate-500">{booking.journey.train.number}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Journey date</p><p className="mt-1 font-black text-slate-900">{new Date(booking.journey.journeyDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Amount</p><p className="mt-1 font-black text-slate-900">{money(booking.totalAmountPaise)}</p><p className="text-sm text-slate-500">{booking.paymentStatus.toLowerCase().replace("_", " ")}</p></div></div>
          <section className="mt-7"><div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-950">Passengers</h2><span className="text-sm font-bold text-slate-400">{booking.passengers.length} traveller{booking.passengers.length === 1 ? "" : "s"}</span></div><div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">{booking.passengers.map((passenger) => <div key={passenger.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-bold text-slate-900">{passenger.name}</p><p className="text-sm text-slate-500">{passenger.age} years · {passenger.gender.toLowerCase()}</p></div><div className="text-right"><p className="font-black text-violet-700">{passenger.seat.seatNumber}</p><p className="text-xs font-bold text-slate-400">{passenger.seat.seatType}</p></div></div>)}</div></section>
          {error && <p aria-live="polite" className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
          <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => window.print()} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Print ticket</button><Link href="/bookings" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">All bookings</Link>{!cancelled && <button onClick={cancel} disabled={cancelling} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">{cancelling ? "Refunding…" : "Cancel & refund"}</button>}</div>
        </div>
      </article>
    </main>
  );
}
