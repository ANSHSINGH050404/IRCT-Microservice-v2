import { Kafka, logLevel } from "kafkajs";
import { logger } from "./logger";
import { config as appConfig } from "./index";

const TOPICS = ["station.created", "train.created", "route.created", "schedule.created"];

const kafka = new Kafka({
  clientId: "search-service",
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
  groupId: "search-service-group",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

export async function connectConsumer() {
  await consumer.connect();
  logger.info("Connected to Kafka");

  await consumer.subscribe({ topics: TOPICS, fromBeginning: false });
  logger.info(`Subscribed to topics: ${TOPICS.join(", ")}`);

  return consumer;
}

export async function disconnectConsumer() {
  await consumer.disconnect();
  logger.info("Disconnected from Kafka");
}

export { consumer, TOPICS };
