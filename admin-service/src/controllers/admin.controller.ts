import type { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";
import { AdminProducer } from "../kafka/producer/admin.producer";

const producer = new AdminProducer();

/* ---------- Station ---------- */

export async function createStation(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code, city, state } = req.body;
    if (!name || !code || !city || !state) {
      res.status(400).json({ message: "name, code, city, and state are required" });
      return;
    }

    const station = await adminService.createStation({ name, code, city, state });
    await producer.stationCreated(station);

    res.status(201).json(station);
  } catch (err) {
    next(err);
  }
}

export async function getStations(_req: Request, res: Response, next: NextFunction) {
  try {
    const stations = await adminService.findAllStations();
    res.json(stations);
  } catch (err) {
    next(err);
  }
}

export async function getStation(req: Request, res: Response, next: NextFunction) {
  try {
    const station = await adminService.findStationById(req.params.id as string);
    res.json(station);
  } catch (err) {
    next(err);
  }
}

/* ---------- Train ---------- */

export async function createTrain(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, number, coachName, totalSeats } = req.body;
    if (!name || !number || !totalSeats) {
      res.status(400).json({ message: "name, number, and totalSeats are required" });
      return;
    }

    const train = await adminService.createTrain({ name, number, coachName, totalSeats });
    if (!train) {
      res.status(500).json({ message: "Failed to create train" });
      return;
    }
    await producer.trainCreated({
      id: train.id,
      name: train.name,
      number: train.number,
      coachName: train.coachName,
      totalSeats: train.totalSeats,
    });

    res.status(201).json(train);
  } catch (err) {
    next(err);
  }
}

export async function getTrains(_req: Request, res: Response, next: NextFunction) {
  try {
    const trains = await adminService.findAllTrains();
    res.json(trains);
  } catch (err) {
    next(err);
  }
}

export async function getTrain(req: Request, res: Response, next: NextFunction) {
  try {
    const train = await adminService.findTrainById(req.params.id as string);
    res.json(train);
  } catch (err) {
    next(err);
  }
}

/* ---------- Route ---------- */

export async function createRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const { trainId, stations } = req.body;
    if (!trainId || !stations || !Array.isArray(stations) || stations.length === 0) {
      res.status(400).json({ message: "trainId and stations array are required" });
      return;
    }

    const route = await adminService.createRoute({ trainId, stations });

    await producer.routeCreated({
      id: route.id,
      trainId: route.trainId,
      stations: route.routeStations.map((rs) => ({
        stationId: rs.stationId,
        stationName: rs.station.name,
        stationCode: rs.station.code,
        stopNumber: rs.stopNumber,
        arrivalTime: rs.arrivalTime,
        departureTime: rs.departureTime,
      })),
    });

    res.status(201).json(route);
  } catch (err) {
    next(err);
  }
}

export async function getRoutes(_req: Request, res: Response, next: NextFunction) {
  try {
    const routes = await adminService.findAllRoutes();
    res.json(routes);
  } catch (err) {
    next(err);
  }
}

export async function getRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const route = await adminService.findRouteById(req.params.id as string);
    res.json(route);
  } catch (err) {
    next(err);
  }
}

/* ---------- Schedule ---------- */

export async function createSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { trainId, journeyDate, departureTime, arrivalTime } = req.body;
    if (!trainId || !journeyDate || !departureTime || !arrivalTime) {
      res.status(400).json({
        message: "trainId, journeyDate, departureTime, and arrivalTime are required",
      });
      return;
    }

    const schedule = await adminService.createSchedule({
      trainId,
      journeyDate,
      departureTime,
      arrivalTime,
    });

    await producer.scheduleCreated({
      id: schedule.id,
      trainId: schedule.trainId,
      trainNumber: schedule.train.number,
      journeyDate: schedule.journeyDate.toISOString(),
      departureTime: schedule.departureTime.toISOString(),
      arrivalTime: schedule.arrivalTime.toISOString(),
    });

    res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
}

export async function getSchedules(_req: Request, res: Response, next: NextFunction) {
  try {
    const schedules = await adminService.findAllSchedules();
    res.json(schedules);
  } catch (err) {
    next(err);
  }
}

export async function getSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await adminService.findScheduleById(req.params.id as string);
    res.json(schedule);
  } catch (err) {
    next(err);
  }
}
