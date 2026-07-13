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
import { requireGatewayUser } from "../middleware/gateway-auth";
import {
  cancelMyBooking,
  checkout,
  getMyBookings,
  getMyTicket,
  getSeatAvailability,
  searchJourneys,
  verifyCheckout,
} from "../controllers/booking.controller";

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

router.get("/booking/journeys", searchJourneys);
router.get("/booking/schedules/:scheduleId/availability", getSeatAvailability);
router.post("/booking/checkout", requireGatewayUser, checkout);
router.post("/booking/:bookingId/payment/verify", requireGatewayUser, verifyCheckout);
router.get("/booking/my-bookings", requireGatewayUser, getMyBookings);
router.get("/booking/tickets/:pnr", requireGatewayUser, getMyTicket);
router.post("/booking/tickets/:pnr/cancel", requireGatewayUser, cancelMyBooking);

export default router;
