import type { Request, Response, NextFunction } from "express";
import { searchIndex, STATION_INDEX, TRAIN_INDEX, ROUTE_INDEX, SCHEDULE_INDEX } from "../config/elasticsearch";

async function searchAll(index: string, q: string) {
  if (!q.trim()) {
    return searchIndex(index, "");
  }
  return searchIndex(index, q);
}

export async function searchStations(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || "";
    const results = await searchAll(STATION_INDEX, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function searchTrains(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || "";
    const results = await searchAll(TRAIN_INDEX, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function searchRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || "";
    const results = await searchAll(ROUTE_INDEX, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function searchSchedules(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || "";
    const results = await searchAll(SCHEDULE_INDEX, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}
