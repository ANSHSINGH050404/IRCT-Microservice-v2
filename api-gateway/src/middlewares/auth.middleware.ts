import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { AuthenticatedRequest, JwtPayload } from '../types/index.js';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken;

  if (!token) {
    res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    return;
  }

  try {
    const decoded = jwt.verify(token as string, config.jwt.accessTokenSecret as string, {
      algorithms: [config.jwt.algorithm as jwt.Algorithm],
    }) as JwtPayload;

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

export function setUserHeaders(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (req.user) {
    req.headers['x-user-id'] = req.user.id;
    if (req.user.role) {
      req.headers['x-user-role'] = req.user.role;
    }
  }
  next();
}