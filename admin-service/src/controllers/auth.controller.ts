import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { config } from "../config";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ message: "email, password, and name are required" });
      return;
    }

    const admin = await authService.register({ email, password, name, role });
    res.status(201).json(admin);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const result = await authService.login(email, password);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken ?? req.body.refreshToken;
    if (!token) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    const result = await authService.refreshToken(token);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = await authService.getProfile(req.admin!.id);
    res.json(admin);
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ message: "Logged out successfully" });
}
