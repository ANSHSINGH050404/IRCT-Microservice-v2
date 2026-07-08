import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
