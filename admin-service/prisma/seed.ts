import bcrypt from "bcrypt";
import { PrismaClient, SeatType } from "@prisma/client";

const prisma = new PrismaClient();

const stations = [
  ["New Delhi", "NDLS", "New Delhi", "Delhi"],
  ["Kanpur Central", "CNB", "Kanpur", "Uttar Pradesh"],
  ["Prayagraj Junction", "PRYJ", "Prayagraj", "Uttar Pradesh"],
  ["Patna Junction", "PNBE", "Patna", "Bihar"],
  ["Howrah Junction", "HWH", "Howrah", "West Bengal"],
  ["Mumbai Central", "MMCT", "Mumbai", "Maharashtra"],
  ["Surat", "ST", "Surat", "Gujarat"],
  ["Ahmedabad Junction", "ADI", "Ahmedabad", "Gujarat"],
] as const;

const trains = [
  { name: "Ganga Express", number: "12301", route: ["NDLS", "CNB", "PRYJ", "PNBE", "HWH"], departure: "06:00", arrival: "19:30" },
  { name: "Western Star", number: "12901", route: ["MMCT", "ST", "ADI"], departure: "07:15", arrival: "14:45" },
  { name: "Capital Connector", number: "12401", route: ["NDLS", "ADI"], departure: "21:30", arrival: "08:15" },
] as const;

const fares = {
  [SeatType.AC]: 150000,
  [SeatType.Sleeper]: 80000,
  [SeatType.Seater]: 50000,
};

function dateAt(date: Date, time: string) {
  const dateKey = date.toISOString().slice(0, 10);
  return new Date(`${dateKey}T${time}:00+05:30`);
}

async function ensureSeats(trainId: string, totalSeats: number) {
  const existing = await prisma.seat.count({ where: { trainId } });
  if (existing > 0) return;
  const types = [SeatType.AC, SeatType.Sleeper, SeatType.Seater];
  const perType = Math.floor(totalSeats / types.length);
  const data = types.flatMap((seatType, typeIndex) => {
    const count = typeIndex === types.length - 1 ? totalSeats - perType * (types.length - 1) : perType;
    const prefix = seatType === SeatType.AC ? "A" : seatType === SeatType.Sleeper ? "S" : "E";
    return Array.from({ length: count }, (_, index) => ({
      trainId,
      seatNumber: `${prefix}${String(typeIndex * perType + index + 1).padStart(2, "0")}`,
      seatType,
      pricePaise: fares[seatType],
    }));
  });
  await prisma.seat.createMany({ data });
}

async function main() {
  const stationByCode = new Map<string, string>();
  for (const [name, code, city, state] of stations) {
    const station = await prisma.station.upsert({
      where: { code },
      create: { name, code, city, state },
      update: { name, city, state },
    });
    stationByCode.set(code, station.id);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const item of trains) {
    const train = await prisma.train.upsert({
      where: { number: item.number },
      create: { name: item.name, number: item.number, coachName: "Mixed", totalSeats: 60 },
      update: { name: item.name, coachName: "Mixed", totalSeats: 60 },
    });
    await ensureSeats(train.id, 60);

    const stationIds = item.route.map((code) => stationByCode.get(code)!);
    await prisma.route.upsert({
      where: { trainId: train.id },
      create: {
        trainId: train.id,
        routeStations: {
          create: stationIds.map((stationId, index) => ({
            stationId,
            stopNumber: index + 1,
            arrivalTime: index === 0 ? null : `${String(6 + index * 3).padStart(2, "0")}:00`,
            departureTime: index === stationIds.length - 1 ? null : `${String(6 + index * 3).padStart(2, "0")}:15`,
          })),
        },
      },
      update: {},
    });

    for (let offset = 1; offset <= 14; offset++) {
      const journeyDate = new Date(today);
      journeyDate.setUTCDate(journeyDate.getUTCDate() + offset);
      const departureTime = dateAt(journeyDate, item.departure);
      let arrivalTime = dateAt(journeyDate, item.arrival);
      if (arrivalTime <= departureTime) arrivalTime.setUTCDate(arrivalTime.getUTCDate() + 1);
      await prisma.schedule.upsert({
        where: { trainId_journeyDate: { trainId: train.id, journeyDate } },
        create: { trainId: train.id, journeyDate, departureTime, arrivalTime },
        update: { departureTime, arrivalTime },
      });
    }
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("Demo rail data seeded. Set ADMIN_EMAIL and ADMIN_PASSWORD to seed the initial administrator.");
    return;
  }
  await prisma.admin.upsert({
    where: { email },
    create: { email, password: await bcrypt.hash(password, 12), name: process.env.ADMIN_NAME ?? "System Administrator", role: "admin" },
    update: {},
  });
  console.log("Demo rail data and initial administrator are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
