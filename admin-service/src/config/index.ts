import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "4002", 10),
  databaseUrl: process.env.DATABASE_URL || "",
};
