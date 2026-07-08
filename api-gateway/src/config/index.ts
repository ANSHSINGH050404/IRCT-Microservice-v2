import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '8000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  services: {
    userService: process.env.USER_SERVICE_URL ?? 'http://localhost:4001',
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'default-secret',
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

  get isDevelopment() {
    return this.nodeEnv === 'development';
  },

  get isProduction() {
    return this.nodeEnv === 'production';
  },
};
