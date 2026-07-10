import { Kafka, logLevel } from "kafkajs";
import { logger } from "./logger";

const kafka = new Kafka({
  clientId: "user-service",
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9093"],
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
process.on("SIGTNT", shutdown);

export { consumer, shutdown };
