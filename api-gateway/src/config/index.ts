import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  services: {
    userService: process.env.USER_SERVICE_URL ?? 'http://localhost:4001',
    adminService: process.env.ADMIN_SERVICE_URL ?? 'http://localhost:4002',
    searchService: process.env.SEARCH_SERVICE_URL ?? 'http://localhost:4003',
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'default-secret',
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? process.env.JWT_SECRET ?? 'default-secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ?? 'default-refresh-secret',
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
    issuer: process.env.JWT_ISSUER ?? 'irct',
    audience: process.env.JWT_AUDIENCE ?? 'irct-users',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  },

  authRateLimit: {
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '20', 10),
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  get isDevelopment() {
    return this.nodeEnv === 'development';
  },

  get isProduction() {
    return this.nodeEnv === 'production';
  },
};
