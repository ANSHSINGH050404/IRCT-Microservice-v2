import { Kafka, logLevel } from "kafkajs";
import { logger } from "./logger";
import { config as appConfig } from "./index";

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: appConfig.kafka.brokers,
  logLevel: logLevel.ERROR,

  retry: {
    initialRetryTime: 300,
    retries: 10,
    maxRetryTime: 3000,
    multiplier: 2,
  },
});

const consumer = kafka.consumer({
  groupId: "notification-service-group",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const shutdown = async () => {
  logger.info("Shutting down kafka");

  await consumer.disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { consumer, shutdown };
