import type { Request } from 'express';

export interface JwtPayload {
  id: string;
  role?: string;
  jti?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
