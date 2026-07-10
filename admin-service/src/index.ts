import express from "express";
import cookieParser from "cookie-parser";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, logger } from "./middleware";
import { prisma } from "./utils/prisma";
import { connectProducer, disconnectProducer } from "./config/kafka";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(logger);
app.use("/api", routes);
app.use(errorHandler);

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    await connectProducer();
    console.log("Kafka producer connected");

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    await prisma.$disconnect();
    await disconnectProducer();
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  await disconnectProducer();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  await disconnectProducer();
  process.exit(0);
});

main();
