import type { NextFunction, Request, Response } from "express";
import { AdminProducer } from "../kafka/producer/admin.producer";
import * as bookingService from "../services/booking.service";
import { BadRequestError } from "../utils/error";

const producer = new AdminProducer();

function stringQuery(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new BadRequestError(`${field} is required`);
  return value;
}

export async function searchJourneys(req: Request, res: Response, next: NextFunction) {
  try {
    const journeys = await bookingService.findJourneys({
      fromStationId: stringQuery(req.query.fromStationId, "fromStationId"),
      toStationId: stringQuery(req.query.toStationId, "toStationId"),
      journeyDate: stringQuery(req.query.journeyDate, "journeyDate"),
    });
    res.json({ journeys });
  } catch (error) {
    next(error);
  }
}

export async function getSeatAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const availability = await bookingService.getAvailability(
      req.params.scheduleId,
      stringQuery(req.query.fromStationId, "fromStationId"),
      stringQuery(req.query.toStationId, "toStationId"),
    );
    res.json(availability);
  } catch (error) {
    next(error);
  }
}

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await bookingService.beginCheckout(req.gatewayUser!, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await bookingService.confirmPayment(req.gatewayUser!.id, req.params.bookingId, req.body);
    await producer.bookingConfirmed({
      pnr: booking.pnr!,
      email: req.gatewayUser!.email,
      trainName: booking.journey.train.name,
      trainNumber: booking.journey.train.number,
      journeyDate: new Date(booking.journey.journeyDate).toISOString(),
      fromStation: booking.journey.fromStation.name,
      toStation: booking.journey.toStation.name,
      passengerCount: booking.passengers.length,
      totalAmountPaise: booking.totalAmountPaise,
    });
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const bookings = await bookingService.listMyBookings(req.gatewayUser!.id);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
}

export async function getMyTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await bookingService.getMyBooking(req.gatewayUser!.id, req.params.pnr);
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function cancelMyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await bookingService.cancelBooking(req.gatewayUser!.id, req.params.pnr);
    await producer.bookingCancelled({
      pnr: booking.pnr!,
      email: req.gatewayUser!.email,
      trainName: booking.journey.train.name,
      trainNumber: booking.journey.train.number,
      totalAmountPaise: booking.totalAmountPaise,
    });
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}
