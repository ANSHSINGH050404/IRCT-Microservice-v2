import express from "express";
import { authenticate, setUserHeaders } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import { config } from "../config/index.js";
import { createProxy } from "../services/proxy.js";

const router = express.Router();

const userServiceProxy = createProxy("userService", config.services.userService, { '^/': '/api/v1/users/' });
const adminServiceProxy = createProxy("adminService", config.services.adminService, { '^/': '/api/' });
const searchServiceProxy = createProxy("searchService", config.services.searchService, { '^/': '/api/search/' });
const bookingServiceProxy = createProxy("adminService", config.services.adminService, { '^/': '/api/booking/' });

router.post("/users/auth/send-otp", authRateLimiter, userServiceProxy);

router.post("/users/auth/verify-otp", authRateLimiter, userServiceProxy);

router.post("/users/auth/login", authRateLimiter, userServiceProxy);

router.post("/users/auth/refresh-token", userServiceProxy);

router.get("/users/user/profile", authenticate, setUserHeaders, userServiceProxy);

router.use("/admin", adminServiceProxy);
router.use("/search", searchServiceProxy);
router.use("/booking", bookingServiceProxy);

router.get("/gateway/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
