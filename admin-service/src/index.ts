import express from "express";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, logger } from "./middleware";
import { prisma } from "./utils/prisma";

const app = express();

app.use(express.json());
app.use(logger);
app.use("/api", routes);
app.use(errorHandler);

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
