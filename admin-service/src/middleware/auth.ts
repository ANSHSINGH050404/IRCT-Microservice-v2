import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/auth";
import { UnauthorizedError } from "../utils/error";

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken ?? req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new UnauthorizedError("Access token is required");
  }

  const decoded = verifyAccessToken(token);
  req.admin = { id: decoded.id };

  next();
};
