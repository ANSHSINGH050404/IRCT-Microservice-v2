import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createStation,
  getStations,
  getStation,
  createTrain,
  getTrains,
  getTrain,
  createRoute,
  getRoutes,
  getRoute,
  createSchedule,
  getSchedules,
  getSchedule,
} from "../controllers/admin.controller";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/auth", authRoutes);

router.post("/stations", authenticate, createStation);
router.get("/stations", getStations);
router.get("/stations/:id", getStation);

router.post("/trains", authenticate, createTrain);
router.get("/trains", getTrains);
router.get("/trains/:id", getTrain);

router.post("/routes", authenticate, createRoute);
router.get("/routes", getRoutes);
router.get("/routes/:id", getRoute);

router.post("/schedules", authenticate, createSchedule);
router.get("/schedules", getSchedules);
router.get("/schedules/:id", getSchedule);

export default router;
