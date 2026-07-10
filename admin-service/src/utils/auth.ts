import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config";

export const generateAccessToken = (adminId: string): string => {
  const payload = { id: adminId };
  return jwt.sign(payload, config.jwt.accessTokenSecret, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (adminId: string): { token: string; jti: string } => {
  const jti = crypto.randomUUID();
  const payload = { id: adminId, jti };
  const token = jwt.sign(payload, config.jwt.refreshTokenSecret, {
    expiresIn: "7d",
  });
  return { token, jti };
};

export const verifyAccessToken = (token: string): { id: string } => {
  const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as { id: string };
  return decoded;
};

export const verifyRefreshToken = (token: string): { id: string; jti: string } => {
  const decoded = jwt.verify(token, config.jwt.refreshTokenSecret) as {
    id: string;
    jti: string;
  };
  return decoded;
};
