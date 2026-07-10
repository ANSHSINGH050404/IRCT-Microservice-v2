import { prisma } from "../utils/prisma";
import { Prisma } from "@prisma/client";
import { NotFoundError, BadRequestError } from "../utils/error";

const SEAT_TYPE_PRICES = {
  AC: 1500,
  Sleeper: 800,
  Seater: 500,
} as const;

const SEAT_TYPES: ("AC" | "Sleeper" | "Seater")[] = ["AC", "Sleeper", "Seater"];

/* ---------- Station ---------- */

export async function createStation(data: {
  name: string;
  code: string;
  city: string;
  state: string;
}) {
  const existing = await prisma.station.findUnique({ where: { code: data.code } });
  if (existing) {
    throw new BadRequestError(`Station with code ${data.code} already exists`);
  }
  return prisma.station.create({ data });
}

export async function findAllStations() {
  return prisma.station.findMany({ orderBy: { name: "asc" } });
}

export async function findStationById(id: string) {
  const station = await prisma.station.findUnique({ where: { id } });
  if (!station) throw new NotFoundError("Station not found");
  return station;
}

/* ---------- Train ---------- */

export async function createTrain(data: {
  name: string;
  number: string;
  coachName?: string;
  totalSeats: number;
}) {
  const existing = await prisma.train.findUnique({ where: { number: data.number } });
  if (existing) {
    throw new BadRequestError(`Train with number ${data.number} already exists`);
  }

  const train = await prisma.train.create({
    data: {
      name: data.name,
      number: data.number,
      coachName: data.coachName ?? "AC",
      totalSeats: data.totalSeats,
    },
  });

  const seats = generateSeats(data.totalSeats, train.id);
  await prisma.seat.createMany({ data: seats });

  return prisma.train.findUnique({
    where: { id: train.id },
    include: { seats: true },
  });
}

function generateSeats(totalSeats: number, trainId: string) {
  const seatsPerType = Math.floor(totalSeats / SEAT_TYPES.length);
  const seats: {
    trainId: string;
    seatNumber: string;
    seatType: "AC" | "Sleeper" | "Seater";
    price: number;
  }[] = [];

  let counter = 1;
  for (const seatType of SEAT_TYPES) {
    const count = seatType === SEAT_TYPES[SEAT_TYPES.length - 1]
      ? totalSeats - seatsPerType * (SEAT_TYPES.length - 1)
      : seatsPerType;

    for (let i = 0; i < count; i++) {
      seats.push({
        trainId,
        seatNumber: `${seatType === "AC" ? "A" : seatType === "Sleeper" ? "S" : "E"}${String(counter).padStart(2, "0")}`,
        seatType,
        price: SEAT_TYPE_PRICES[seatType],
      });
      counter++;
    }
  }

  return seats;
}

export async function findAllTrains() {
  return prisma.train.findMany({
    orderBy: { createdAt: "desc" },
    include: { seats: true },
  });
}

export async function findTrainById(id: string) {
  const train = await prisma.train.findUnique({
    where: { id },
    include: { seats: true },
  });
  if (!train) throw new NotFoundError("Train not found");
  return train;
}

/* ---------- Route ---------- */

export async function createRoute(data: {
  trainId: string;
  stations: {
    stationId: string;
    stopNumber: number;
    arrivalTime?: string;
    departureTime?: string;
  }[];
}) {
  const train = await prisma.train.findUnique({ where: { id: data.trainId } });
  if (!train) throw new NotFoundError("Train not found");

  const existingRoute = await prisma.route.findUnique({ where: { trainId: data.trainId } });
  if (existingRoute) {
    throw new BadRequestError("Route already exists for this train");
  }

  const stationIds = data.stations.map((s) => s.stationId);
  const foundStations = await prisma.station.findMany({
    where: { id: { in: stationIds } },
  });
  if (foundStations.length !== stationIds.length) {
    throw new BadRequestError("One or more stations not found");
  }

  const route = await prisma.route.create({
    data: {
      trainId: data.trainId,
      routeStations: {
        create: data.stations.map((s) => ({
          stationId: s.stationId,
          stopNumber: s.stopNumber,
          arrivalTime: s.arrivalTime ?? null,
          departureTime: s.departureTime ?? null,
        })),
      },
    },
    include: {
      train: true,
      routeStations: {
        orderBy: { stopNumber: "asc" },
        include: { station: true },
      },
    },
  });

  return route;
}

export async function findAllRoutes() {
  return prisma.route.findMany({
    include: {
      train: true,
      routeStations: {
        orderBy: { stopNumber: "asc" },
        include: { station: true },
      },
    },
  });
}

export async function findRouteById(id: string) {
  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      train: true,
      routeStations: {
        orderBy: { stopNumber: "asc" },
        include: { station: true },
      },
    },
  });
  if (!route) throw new NotFoundError("Route not found");
  return route;
}

/* ---------- Schedule ---------- */

export async function createSchedule(data: {
  trainId: string;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
}) {
  const train = await prisma.train.findUnique({ where: { id: data.trainId } });
  if (!train) throw new NotFoundError("Train not found");

  const schedule = await prisma.schedule.create({
    data: {
      trainId: data.trainId,
      journeyDate: new Date(data.journeyDate),
      departureTime: new Date(data.departureTime),
      arrivalTime: new Date(data.arrivalTime),
    },
    include: { train: true },
  });

  return schedule;
}

export async function findAllSchedules() {
  return prisma.schedule.findMany({
    include: { train: true },
    orderBy: { journeyDate: "desc" },
  });
}

export async function findScheduleById(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { train: true },
  });
  if (!schedule) throw new NotFoundError("Schedule not found");
  return schedule;
}
