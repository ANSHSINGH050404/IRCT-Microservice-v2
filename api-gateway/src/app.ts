import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { globalRateLimiter } from "./middlewares/rateLimiter.js";
import { requestLogger } from "./middlewares/req.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(globalRateLimiter);
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API Gateway is running" });
});

app.use("/api/v1", routes);
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export default app;
