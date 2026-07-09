import express from "express";
import { authenticate, setUserHeaders } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import { config } from "../config/index.js";
import { createProxy } from "../services/proxy.js";

const router = express.Router();

const userServiceProxy = createProxy("userService", config.services.userService);

router.post("/users/auth/send-otp", authRateLimiter, userServiceProxy);

router.post("/users/auth/verify-otp", authRateLimiter, userServiceProxy);

router.post("/users/auth/login", authRateLimiter, userServiceProxy);

router.post("/users/auth/refresh-token", userServiceProxy);

router.get("/users/user/profile", authenticate, setUserHeaders, userServiceProxy);

router.get("/gateway/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
