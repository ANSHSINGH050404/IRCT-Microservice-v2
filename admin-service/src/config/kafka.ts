import { Kafka, logLevel } from "kafkajs";
import { logger } from "./logger";

const kafka = new Kafka({
  clientId: "admin-service",
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092"],
  logLevel: logLevel.ERROR,
  retry: {
    initialRetryTime: 300,
    retries: 10,
    maxRetryTime: 3000,
  },
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
  idempotent: true,
  maxInFlightRequests: 5,
  retry: {
    retries: 5,
  },
});

let isConnected = false;

const connectProducer = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    logger.info("Kafka producer connected successfully.");
  }
};

const disconnectProducer = async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    logger.info("Kafka producer disconnected.");
  }
};

process.on("SIGTERM", disconnectProducer);
process.on("SIGINT", disconnectProducer);

export { producer, connectProducer, disconnectProducer };
