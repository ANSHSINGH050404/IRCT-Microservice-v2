import { Router } from "express";
import {
  searchStations,
  searchTrains,
  searchRoutes,
  searchSchedules,
} from "../controllers/search.controller";

const router = Router();

router.get("/stations", searchStations);
router.get("/trains", searchTrains);
router.get("/routes", searchRoutes);
router.get("/schedules", searchSchedules);

export default router;
