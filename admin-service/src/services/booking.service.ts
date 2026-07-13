import { randomInt } from "node:crypto";
import { BookingStatus, Gender, PaymentStatus, Prisma } from "@prisma/client";
import { config } from "../config";
import { prisma } from "../utils/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/error";
import { createPaymentOrder, createRefund, verifyPaymentSignature } from "./payment.service";

const bookingInclude = {
  schedule: { include: { train: true } },
  fromStation: true,
  toStation: true,
  passengers: { include: { seat: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.BookingInclude;

type CheckoutPassenger = {
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  seatId: string;
};

type CheckoutInput = {
  scheduleId: string;
  fromStationId: string;
  toStationId: string;
  passengers: CheckoutPassenger[];
};

type GatewayUser = { id: string; email: string };

function parseJourneyDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestError("journeyDate must use YYYY-MM-DD format");
  }
  const start = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(start.valueOf())) throw new BadRequestError("journeyDate is invalid");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function validatePassengers(passengers: unknown): asserts passengers is CheckoutPassenger[] {
  if (!Array.isArray(passengers) || passengers.length === 0 || passengers.length > 6) {
    throw new BadRequestError("Provide between one and six passengers");
  }

  const usedSeats = new Set<string>();
  for (const passenger of passengers) {
    if (!passenger || typeof passenger !== "object") {
      throw new BadRequestError("Each passenger is invalid");
    }
    const value = passenger as Record<string, unknown>;
    if (typeof value.name !== "string" || value.name.trim().length < 2 || value.name.trim().length > 100) {
      throw new BadRequestError("Each passenger needs a valid name");
    }
    if (!Number.isInteger(value.age) || (value.age as number) < 1 || (value.age as number) > 120) {
      throw new BadRequestError("Each passenger needs a valid age");
    }
    if (!["MALE", "FEMALE", "OTHER"].includes(value.gender as string)) {
      throw new BadRequestError("Each passenger needs a valid gender");
    }
    if (typeof value.phone !== "string" || !/^[0-9+() -]{7,20}$/.test(value.phone)) {
      throw new BadRequestError("Each passenger needs a valid phone number");
    }
    if (typeof value.seatId !== "string" || !value.seatId || usedSeats.has(value.seatId)) {
      throw new BadRequestError("Choose a different available seat for every passenger");
    }
    usedSeats.add(value.seatId);
  }
}

function ensureRouteDirection(routeStations: { stationId: string; stopNumber: number }[], fromStationId: string, toStationId: string) {
  const from = routeStations.find((station) => station.stationId === fromStationId);
  const to = routeStations.find((station) => station.stationId === toStationId);
  if (!from || !to || from.stopNumber >= to.stopNumber) {
    throw new BadRequestError("Select stations in the train's travel direction");
  }
}

function generatePnr() {
  return `${new Date().getUTCFullYear().toString().slice(-2)}${String(randomInt(0, 100_000_000)).padStart(8, "0")}`;
}

async function withBookingLock<T>(scheduleId: string, operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    // A schedule-level PostgreSQL advisory lock makes seat availability checks and holds atomic.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${scheduleId}))`;
    return operation(tx);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 });
}

async function loadScheduleForBooking(tx: any, scheduleId: string) {
  const schedule = await tx.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      train: {
        include: {
          seats: true,
          route: {
            include: {
              routeStations: { orderBy: { stopNumber: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!schedule || !schedule.train.route) throw new NotFoundError("Scheduled train route not found");
  return schedule;
}

function mapBooking(booking: any) {
  return {
    id: booking.id,
    pnr: booking.pnr,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    totalAmountPaise: booking.totalAmountPaise,
    totalAmount: booking.totalAmountPaise / 100,
    createdAt: booking.createdAt,
    cancelledAt: booking.cancelledAt,
    expiresAt: booking.expiresAt,
    journey: {
      id: booking.schedule.id,
      journeyDate: booking.schedule.journeyDate,
      departureTime: booking.schedule.departureTime,
      arrivalTime: booking.schedule.arrivalTime,
      train: booking.schedule.train,
      fromStation: booking.fromStation,
      toStation: booking.toStation,
    },
    passengers: booking.passengers.map((passenger: any) => ({
      id: passenger.id,
      name: passenger.name,
      age: passenger.age,
      gender: passenger.gender,
      phone: passenger.phone,
      farePaise: passenger.farePaise,
      seat: passenger.seat,
    })),
  };
}

async function activeSeatKeys(scheduleIds: string[], now = new Date()) {
  if (scheduleIds.length === 0) return new Set<string>();
  const reservations = await prisma.bookingPassenger.findMany({
    where: {
      booking: {
        scheduleId: { in: scheduleIds },
        OR: [
          { status: BookingStatus.CONFIRMED },
          { status: BookingStatus.PENDING, expiresAt: { gt: now } },
        ],
      },
    },
    select: { seatId: true, booking: { select: { scheduleId: true } } },
  });
  return new Set(reservations.map((reservation) => `${reservation.booking.scheduleId}:${reservation.seatId}`));
}

export async function findJourneys(input: { fromStationId: string; toStationId: string; journeyDate: string }) {
  if (!input.fromStationId || !input.toStationId) throw new BadRequestError("Source and destination are required");
  const { start, end } = parseJourneyDate(input.journeyDate);
  const schedules = await prisma.schedule.findMany({
    where: { journeyDate: { gte: start, lt: end } },
    include: {
      train: {
        include: {
          seats: { orderBy: { seatNumber: "asc" } },
          route: {
            include: {
              routeStations: { include: { station: true }, orderBy: { stopNumber: "asc" } },
            },
          },
        },
      },
    },
    orderBy: { departureTime: "asc" },
  });

  const matchingSchedules = schedules.filter((schedule) => {
    const stations = schedule.train.route?.routeStations ?? [];
    const from = stations.find((station) => station.stationId === input.fromStationId);
    const to = stations.find((station) => station.stationId === input.toStationId);
    return Boolean(from && to && from.stopNumber < to.stopNumber);
  });
  const occupied = await activeSeatKeys(matchingSchedules.map((schedule) => schedule.id));

  return matchingSchedules.map((schedule) => {
    const availableSeats = schedule.train.seats.filter((seat) => !occupied.has(`${schedule.id}:${seat.id}`));
    const routeStations = schedule.train.route!.routeStations;
    return {
      id: schedule.id,
      journeyDate: schedule.journeyDate,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      train: { id: schedule.train.id, name: schedule.train.name, number: schedule.train.number },
      fromStation: routeStations.find((station) => station.stationId === input.fromStationId)!.station,
      toStation: routeStations.find((station) => station.stationId === input.toStationId)!.station,
      availableSeatCount: availableSeats.length,
      fares: [...new Set(availableSeats.map((seat) => seat.pricePaise))].sort((a, b) => a - b),
    };
  });
}

export async function getAvailability(scheduleId: string, fromStationId: string, toStationId: string) {
  const schedule = await loadScheduleForBooking(prisma, scheduleId);
  ensureRouteDirection(schedule.train.route!.routeStations, fromStationId, toStationId);
  const occupied = await activeSeatKeys([scheduleId]);
  return {
    scheduleId,
    expiresInMinutes: config.bookingHoldMinutes,
    seats: schedule.train.seats
      .filter((seat) => !occupied.has(`${scheduleId}:${seat.id}`))
      .map((seat) => ({ ...seat, price: seat.pricePaise / 100 })),
  };
}

export async function beginCheckout(user: GatewayUser, input: CheckoutInput) {
  validatePassengers(input.passengers);
  const booking = await withBookingLock(input.scheduleId, async (tx) => {
    const schedule = await loadScheduleForBooking(tx, input.scheduleId);
    if (schedule.departureTime <= new Date()) throw new BadRequestError("This train has already departed");
    ensureRouteDirection(schedule.train.route!.routeStations, input.fromStationId, input.toStationId);

    const chosenSeats = schedule.train.seats.filter((seat) => input.passengers.some((passenger) => passenger.seatId === seat.id));
    if (chosenSeats.length !== input.passengers.length) {
      throw new BadRequestError("One or more selected seats are invalid");
    }

    const existingReservations = await tx.bookingPassenger.findMany({
      where: {
        seatId: { in: chosenSeats.map((seat) => seat.id) },
        booking: {
          scheduleId: input.scheduleId,
          OR: [
            { status: BookingStatus.CONFIRMED },
            { status: BookingStatus.PENDING, expiresAt: { gt: new Date() } },
          ],
        },
      },
      select: { seatId: true },
    });
    if (existingReservations.length > 0) {
      throw new ConflictError("One or more selected seats were just booked. Please choose again.");
    }

    const seatsById = new Map(chosenSeats.map((seat) => [seat.id, seat]));
    const expiresAt = new Date(Date.now() + config.bookingHoldMinutes * 60_000);
    return tx.booking.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        scheduleId: input.scheduleId,
        fromStationId: input.fromStationId,
        toStationId: input.toStationId,
        totalAmountPaise: input.passengers.reduce((total, passenger) => total + seatsById.get(passenger.seatId)!.pricePaise, 0),
        expiresAt,
        passengers: {
          create: input.passengers.map((passenger) => ({
            name: passenger.name.trim(),
            age: passenger.age,
            gender: passenger.gender as Gender,
            phone: passenger.phone.trim(),
            seatId: passenger.seatId,
            farePaise: seatsById.get(passenger.seatId)!.pricePaise,
          })),
        },
      },
      include: bookingInclude,
    });
  });

  try {
    const order = await createPaymentOrder(booking.id, booking.totalAmountPaise);
    await prisma.booking.update({ where: { id: booking.id }, data: { razorpayOrderId: order.id } });
    return {
      booking: mapBooking(booking),
      payment: { orderId: order.id, amountPaise: order.amount, currency: order.currency, keyId: order.keyId },
    };
  } catch (error) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.PAYMENT_FAILED, paymentStatus: PaymentStatus.FAILED } });
    throw error;
  }
}

export async function confirmPayment(userId: string, bookingId: string, input: { orderId: string; paymentId: string; signature: string }) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId }, include: bookingInclude });
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.status !== BookingStatus.PENDING || !booking.expiresAt || booking.expiresAt <= new Date()) {
    throw new ConflictError("This payment hold has expired. Please start a new booking.");
  }
  if (booking.razorpayOrderId !== input.orderId) throw new BadRequestError("Payment order does not match this booking");

  const verification = await verifyPaymentSignature(input);
  if (!verification.valid) throw new BadRequestError("Payment signature verification failed");

  const pnr = generatePnr();
  const updated = await prisma.booking.updateMany({
    where: { id: bookingId, userId, status: BookingStatus.PENDING, razorpayOrderId: input.orderId, expiresAt: { gt: new Date() } },
    data: {
      pnr,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      razorpayPaymentId: input.paymentId,
      expiresAt: null,
    },
  });
  if (updated.count !== 1) throw new ConflictError("This booking was already completed or expired");

  const confirmed = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: bookingInclude });
  return mapBooking(confirmed);
}

export async function listMyBookings(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: { userId, status: { in: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED] } },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
  return bookings.map(mapBooking);
}

export async function getMyBooking(userId: string, pnr: string) {
  const booking = await prisma.booking.findFirst({ where: { userId, pnr }, include: bookingInclude });
  if (!booking) throw new NotFoundError("Ticket not found");
  return mapBooking(booking);
}

export async function cancelBooking(userId: string, pnr: string) {
  const booking = await prisma.booking.findFirst({ where: { userId, pnr }, include: bookingInclude });
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.status !== BookingStatus.CONFIRMED || booking.paymentStatus !== PaymentStatus.PAID) {
    throw new ConflictError("Only confirmed, paid bookings can be cancelled");
  }
  if (booking.schedule.departureTime <= new Date()) throw new BadRequestError("Bookings cannot be cancelled after departure");
  if (!booking.razorpayPaymentId) throw new ConflictError("No captured payment was found for this booking");

  const claimed = await prisma.booking.updateMany({
    where: { id: booking.id, paymentStatus: PaymentStatus.PAID },
    data: { paymentStatus: PaymentStatus.REFUND_PENDING as PaymentStatus },
  });
  if (claimed.count !== 1) throw new ConflictError("A refund is already being processed for this booking");

  try {
    const refund = await createRefund(booking.razorpayPaymentId, booking.totalAmountPaise, booking.id);
    const cancelled = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        razorpayRefundId: refund.id,
        cancelledAt: new Date(),
      },
      include: bookingInclude,
    });
    return mapBooking(cancelled);
  } catch (error) {
    await prisma.booking.update({ where: { id: booking.id }, data: { paymentStatus: PaymentStatus.PAID } });
    throw error;
  }
}
