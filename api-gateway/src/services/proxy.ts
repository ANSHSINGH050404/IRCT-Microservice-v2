import { config } from "../config/index.js";
import { logger } from "../config/logger.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { RequestHandler, Request } from "express";

class CircuitBreaker {
  private serviceName: string;
  private threshold: number;
  private timeout: number;
  private failureCount = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private nextAttempt = Date.now();

  constructor(serviceName: string, threshold = 5, timeout = 60000) {
    this.serviceName = serviceName;
    this.threshold = threshold;
    this.timeout = timeout;
  }

  get isOpen(): boolean {
    if (this.state === "open" && Date.now() >= this.nextAttempt) {
      this.state = "half-open";
      logger.info(`Circuit breaker for ${this.serviceName} is half-open.`);
    }
    return this.state === "open";
  }

  recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === "half-open") {
      this.state = "closed";
      logger.info(`Circuit breaker for ${this.serviceName} is closed.`);
    }
  }

  recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = "open";
      this.nextAttempt = Date.now() + this.timeout;
      logger.warn(`Circuit breaker for ${this.serviceName} is open.`);
    }
  }

  getState() {
    return {
      service: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt,
    };
  }
}

const circuitBreakers: Record<string, CircuitBreaker> = {
  userService: new CircuitBreaker("userService"),
  adminService: new CircuitBreaker("adminService"),
  searchService: new CircuitBreaker("searchService"),
};

export function createProxy(serviceName: string, target: string, pathRewrite?: Record<string, string>): RequestHandler {
  const cb = circuitBreakers[serviceName];
  if (!cb) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: pathRewrite ?? {
      '^/users': '/api/v1/users',
      '^/admin': '/api',
      '^/search': '/api/search',
    },
    on: {
      proxyReq: (proxyReq, req: Request) => {
        if (config.internalGatewaySecret) {
          proxyReq.setHeader('x-gateway-secret', config.internalGatewaySecret);
        }
        const rewrittenPath = proxyReq.path;
        logger.info(`Proxying ${req.method} ${req.originalUrl} -> ${serviceName} -> ${rewrittenPath}`);
      },
      proxyRes: () => {
        cb.recordSuccess();
      },
      error: (err) => {
        cb.recordFailure();
        logger.error(`Proxy error for ${serviceName}: ${err.message}`);
      },
    },
  });

  return (req, res, next) => {
    if (cb.isOpen) {
      res.status(503).json({
        success: false,
        message: `Service ${serviceName} is currently unavailable`,
      });
      return;
    }
    proxy(req, res, next);
  };
}

export { circuitBreakers };
