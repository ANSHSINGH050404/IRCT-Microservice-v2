"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { bookingApi, getAccessToken, type BookingPassengerInput, type Seat } from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
      theme: { color: string };
    }) => { open: () => void };
  }
}

const blankPassenger = (): BookingPassengerInput => ({ name: "", age: 18, gender: "OTHER", phone: "", seatId: "" });
const formatMoney = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SeatSelectionPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromStationId = searchParams.get("fromStationId") ?? "";
  const toStationId = searchParams.get("toStationId") ?? "";
  const [seats, setSeats] = useState<Seat[]>([]);
  const [holdMinutes, setHoldMinutes] = useState(10);
  const [passengers, setPassengers] = useState<BookingPassengerInput[]>([blankPassenger()]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (!fromStationId || !toStationId) {
      setError("Route details are missing. Please search for the train again.");
      setLoading(false);
      return;
    }
    bookingApi.availability(scheduleId, fromStationId, toStationId)
      .then((result) => {
        setSeats(result.seats);
        setHoldMinutes(result.expiresInMinutes);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [fromStationId, router, scheduleId, toStationId]);

  const selectedTotal = useMemo(() => passengers.reduce((total, passenger) => {
    return total + (seats.find((seat) => seat.id === passenger.seatId)?.pricePaise ?? 0);
  }, 0), [passengers, seats]);

  function updatePassenger(index: number, patch: Partial<BookingPassengerInput>) {
    setPassengers((current) => current.map((passenger, itemIndex) => itemIndex === index ? { ...passenger, ...patch } : passenger));
  }

  function removePassenger(index: number) {
    setPassengers((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  }

  function seatUnavailableFor(index: number, seatId: string) {
    return passengers.some((passenger, passengerIndex) => passengerIndex !== index && passenger.seatId === seatId);
  }

  async function beginPayment(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (passengers.some((passenger) => !passenger.seatId)) {
      setError("Choose one available seat for every passenger.");
      return;
    }
    setPaying(true);
    try {
      const checkout = await bookingApi.checkout({ scheduleId, fromStationId, toStationId, passengers });
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) throw new Error("Could not load Razorpay checkout. Please try again.");
      const razorpay = new window.Razorpay({
        key: checkout.payment.keyId,
        amount: checkout.payment.amountPaise,
        currency: checkout.payment.currency,
        name: "IRCT Next",
        description: `${passengers.length} seat${passengers.length === 1 ? "" : "s"} reserved for ${holdMinutes} minutes`,
        order_id: checkout.payment.orderId,
        theme: { color: "#6d28d9" },
        handler: async (response) => {
          try {
            const confirmed = await bookingApi.verify(checkout.booking.id, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            router.replace(`/tickets/${confirmed.booking.pnr}`);
          } catch (reason) {
            setError((reason as Error).message);
            setPaying(false);
          }
        },
      });
      razorpay.open();
    } catch (reason) {
      setError((reason as Error).message);
      setPaying(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f7f7fb] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-bold text-violet-700 hover:text-violet-900">← Back to results</Link>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
          <form onSubmit={beginPayment} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">Step 1 of 2</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Build your crew.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Pick one live seat per passenger. Seats are held only after you continue to secure payment.</p>
            {error && <p aria-live="polite" className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
            {loading ? <p className="mt-8 text-sm font-medium text-slate-500">Checking live seat availability…</p> : (
              <div className="mt-7 space-y-5">
                {passengers.map((passenger, index) => (
                  <section key={index} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between"><h2 className="font-black text-slate-900">Passenger {index + 1}</h2>{passengers.length > 1 && <button type="button" onClick={() => removePassenger(index)} className="text-sm font-bold text-rose-600 hover:text-rose-800">Remove</button>}</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input required value={passenger.name} onChange={(event) => updatePassenger(index, { name: event.target.value })} placeholder="Full name" className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                      <input required type="tel" value={passenger.phone} onChange={(event) => updatePassenger(index, { phone: event.target.value })} placeholder="Phone number" className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                      <input required type="number" min="1" max="120" value={passenger.age} onChange={(event) => updatePassenger(index, { age: Number(event.target.value) })} aria-label={`Age for passenger ${index + 1}`} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                      <select value={passenger.gender} onChange={(event) => updatePassenger(index, { gender: event.target.value as BookingPassengerInput["gender"] })} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"><option value="OTHER">Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select>
                    </div>
                    <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">Available seat
                      <select required value={passenger.seatId} onChange={(event) => updatePassenger(index, { seatId: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"><option value="">Choose a seat</option>{seats.map((seat) => <option key={seat.id} value={seat.id} disabled={seatUnavailableFor(index, seat.id)}>{seat.seatNumber} · {seat.seatType} · {formatMoney(seat.pricePaise)}</option>)}</select>
                    </label>
                  </section>
                ))}
                {passengers.length < 6 && <button type="button" onClick={() => setPassengers((current) => [...current, blankPassenger()])} className="rounded-xl border border-dashed border-violet-300 px-4 py-3 text-sm font-bold text-violet-700 hover:bg-violet-50">+ Add passenger</button>}
              </div>
            )}
            <button type="submit" disabled={loading || paying || seats.length === 0} className="mt-7 w-full rounded-2xl bg-[#5b21b6] px-5 py-4 font-black text-white shadow-lg shadow-violet-200 transition hover:bg-[#4c1d95] disabled:cursor-not-allowed disabled:opacity-60">{paying ? "Opening secure payment…" : `Continue to payment · ${formatMoney(selectedTotal)}`}</button>
          </form>
          <aside className="h-fit rounded-[2rem] bg-slate-950 p-6 text-white sm:p-7"><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Live inventory</p><h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">Seats disappear fast.</h2><p className="mt-3 text-sm leading-6 text-slate-300">Your chosen seats are held for {holdMinutes} minutes once checkout begins. Payment is handled securely by Razorpay.</p><div className="mt-6 rounded-2xl bg-white/10 p-4"><p className="text-3xl font-black text-lime-300">{seats.length}</p><p className="mt-1 text-sm text-slate-300">available seats right now</p></div><div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold">{["AC", "Sleeper", "Seater"].map((kind) => <span key={kind} className="rounded-lg bg-white/10 px-2 py-2">{kind}</span>)}</div></aside>
        </div>
      </div>
    </main>
  );
}
