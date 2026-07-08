import { Router } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import { config } from '../config/index.js';
import { authenticate, setUserHeaders } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

type RouteMap = Array<{
  path: string;
  auth: boolean;
  rateLimit?: boolean;
}>;

const routes: RouteMap = [
  // Public auth routes
  { path: '/api/v1/auth/register', auth: false, rateLimit: true },
  { path: '/api/v1/auth/login', auth: false, rateLimit: true },
  { path: '/api/v1/auth/verify-email', auth: false, rateLimit: true },
  { path: '/api/v1/auth/forgot-password', auth: false, rateLimit: true },
  { path: '/api/v1/auth/reset-password', auth: false, rateLimit: true },

  // Protected auth routes
  { path: '/api/v1/auth/logout', auth: true },
  { path: '/api/v1/auth/refresh', auth: true },

  // User routes (all protected)
  { path: '/api/v1/user', auth: true },
];

const router = Router();

function createProxyOptions(): Options {
  return {
    target: config.services.userService,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.headers['x-user-id']) {
          proxyReq.setHeader('x-user-id', req.headers['x-user-id'] as string);
        }
        if (req.headers['x-user-role']) {
          proxyReq.setHeader('x-user-role', req.headers['x-user-role'] as string);
        }
      },
      proxyRes: (proxyRes) => {
        proxyRes.headers['x-powered-by'] = 'api-gateway';
      },
      error: (err, _req, res) => {
        console.error('[Proxy Error]', err.message);
        const typedRes = res as { writeHead?: (code: number, headers: Record<string, string>) => void };
        if (typedRes.writeHead) {
          typedRes.writeHead(502, { 'Content-Type': 'application/json' });
          (res as { end?: (data: string) => void }).end?.(JSON.stringify({
            success: false,
            message: 'Service unavailable',
          }));
        }
      },
    },
  };
}

for (const route of routes) {
  const middleware = [];

  if (route.auth) {
    middleware.push(authenticate, setUserHeaders);
  }
  if (route.rateLimit) {
    middleware.push(authRateLimiter);
  }

  middleware.push(createProxyMiddleware(createProxyOptions()));
  router.use(route.path, ...middleware);
}

export default router;
