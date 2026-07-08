import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/error.middleware.js';
import gatewayRoutes from './routes/gateway.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(globalRateLimiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API Gateway is running' });
});

app.use(gatewayRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
