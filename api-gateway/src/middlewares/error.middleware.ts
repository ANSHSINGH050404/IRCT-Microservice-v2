import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`[Gateway Error] ${err.name}: ${err.message}`);

  const status = (err as any).statusCode ?? (err as any).status ?? 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
    ...(status === 500 && { error: err.message }),
  });
}
