import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'api-gateway' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, service  }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} [Service: ${service}]`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
});