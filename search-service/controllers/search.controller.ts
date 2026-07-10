import type { Request, Response, NextFunction } from "express";
import { esClient, STATION_INDEX, TRAIN_INDEX, ROUTE_INDEX, SCHEDULE_INDEX } from "../config/elasticsearch";

async function searchIndex(index: string, q: string) {
  const { hits } = await esClient.search({
    index,
    query: {
      multi_match: {
        query: q,
        fields: ["*"],
        type: "best_fields",
        fuzziness: "AUTO",
      },
    },
    size: 20,
  });

  return hits.hits.map((h) => ({ id: h._id, ...(h._source as Record<string, unknown>) }));
}

export async function searchStations(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      const { hits } = await esClient.search({
        index: STATION_INDEX,
        query: { match_all: {} },
        size: 20,
      });
      res.json(hits.hits.map((h) => ({ id: h._id, ...(h._source as Record<string, unknown>) })));
      return;
    }
    const results = await searchIndex(STATION_INDEX, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function searchTrains(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      const { hits } = await esClient.search({
        index: TRAIN_INDEX,
        query: { match_all: {} },
        size: 20,
      });
      res.json(hits.hits.map((h) => ({ id: h._id, ...(h._source as Record<string, unknown>) })));
      return;
    }
    const results = await searchIndex(TRAIN_INDEX, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function searchRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      const { hits } = await esClient.search({
        index: ROUTE_INDEX,
        query: { match_all: {} },
        size: 20,
      });
      res.json(hits.hits.map((h) => ({ id: h._id, ...(h._source as Record<string, unknown>) })));
      return;
    }
    const results = await searchIndex(ROUTE_INDEX, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function searchSchedules(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      const { hits } = await esClient.search({
        index: SCHEDULE_INDEX,
        query: { match_all: {} },
        size: 20,
      });
      res.json(hits.hits.map((h) => ({ id: h._id, ...(h._source as Record<string, unknown>) })));
      return;
    }
    const results = await searchIndex(SCHEDULE_INDEX, q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}
