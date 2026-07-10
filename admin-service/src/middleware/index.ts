import type { Request, Response, NextFunction } from "express";
import AppError from "../utils/error";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : "INTERNAL_ERROR";

  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: err.message,
    statusCode,
    code,
  });
}

export function logger(req: Request, _res: Response, next: NextFunction) {
  console.log(`${req.method} ${req.url}`);
  next();
}
