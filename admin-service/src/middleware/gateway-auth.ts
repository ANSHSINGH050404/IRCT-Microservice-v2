import type { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { config } from "../config";
import { UnauthorizedError } from "../utils/error";

declare global {
  namespace Express {
    interface Request {
      gatewayUser?: { id: string; email: string };
    }
  }
}

function safeSecretMatch(provided: string, expected: string) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export function requireGatewayUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  const userEmail = req.header("x-user-email");
  const gatewaySecret = req.header("x-gateway-secret") ?? "";

  if (!safeSecretMatch(gatewaySecret, config.internalGatewaySecret) || !userId || !userEmail) {
    return next(new UnauthorizedError("Authenticated gateway access is required"));
  }

  req.gatewayUser = { id: userId, email: userEmail };
  next();
}
