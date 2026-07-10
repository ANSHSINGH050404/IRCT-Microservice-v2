export const config = {
  port: parseInt(process.env.PORT || "4003", 10),
  kafka: {
    brokers: process.env.KAFKA_BOOTSTRAP_SERVERS?.split(",") ?? ["localhost:9092"],
  },
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  },
};
