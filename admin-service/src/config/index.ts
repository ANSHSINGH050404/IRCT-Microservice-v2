import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "4002", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  kafkaBrokers: process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092",
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "admin-access-secret",
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "admin-refresh-secret",
  },
  get isProduction() {
    return this.nodeEnv === "production";
  },
};
