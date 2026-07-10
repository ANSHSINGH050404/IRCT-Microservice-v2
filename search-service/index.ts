import express from "express";
import cors from "cors";
import { config } from "./config";
import { logger } from "./config/logger";
import { connectConsumer, disconnectConsumer, consumer } from "./config/kafka";
import { connectElasticsearch, disconnectElasticsearch, esClient } from "./config/elasticsearch";
import { STATION_INDEX, TRAIN_INDEX, ROUTE_INDEX, SCHEDULE_INDEX } from "./config/elasticsearch";
import searchRoutes from "./routes/search.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/search", searchRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, err.stack);
  res.status(500).json({ success: false, error: err.message });
});

async function indexDocument(index: string, id: string, body: Record<string, unknown>) {
  await esClient.index({ index, id, body, refresh: "wait_for" });
  logger.info(`Indexed document ${id} into ${index}`);
}

async function startKafkaConsumer() {
  await connectConsumer();

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as { event: string; data: Record<string, unknown> };
        const { data } = parsed;

        switch (topic) {
          case "station.created":
            await indexDocument(STATION_INDEX, data.id as string, {
              id: data.id,
              name: data.name,
              code: data.code,
              city: data.city,
              state: data.state,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            break;

          case "train.created":
            await indexDocument(TRAIN_INDEX, data.id as string, {
              id: data.id,
              name: data.name,
              number: data.number,
              coachName: data.coachName,
              totalSeats: data.totalSeats,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            break;

          case "route.created":
            await indexDocument(ROUTE_INDEX, data.id as string, {
              id: data.id,
              trainId: data.trainId,
              stations: data.stations,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            break;

          case "schedule.created":
            await indexDocument(SCHEDULE_INDEX, data.id as string, {
              id: data.id,
              trainId: data.trainId,
              trainNumber: data.trainNumber,
              journeyDate: data.journeyDate,
              departureTime: data.departureTime,
              arrivalTime: data.arrivalTime,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            break;

          default:
            logger.warn(`Received message on unknown topic: ${topic}`);
            break;
        }
      } catch (err) {
        logger.error(`Failed to process message from ${topic}:`, (err as Error).message);
      }
    },
  });
}

async function main() {
  try {
    await connectElasticsearch();
    logger.info("Elasticsearch ready");

    await startKafkaConsumer();
    logger.info("Kafka consumer started");

    app.listen(config.port, () => {
      logger.info(`Search service running on http://localhost:${config.port}`);
    });
  } catch (err) {
    logger.error("Failed to start search service:", (err as Error).message);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  await disconnectConsumer();
  await disconnectElasticsearch();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await disconnectConsumer();
  await disconnectElasticsearch();
  process.exit(0);
});

main();
