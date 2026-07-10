import { Client } from "@elastic/elasticsearch";
import type { MappingTypeMapping } from "@elastic/elasticsearch/lib/api/types";

export const STATION_INDEX = "stations";
export const TRAIN_INDEX = "trains";
export const ROUTE_INDEX = "routes";
export const SCHEDULE_INDEX = "schedules";

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";

export const esClient = new Client({ node: ELASTICSEARCH_URL });

let isConnected = false;

const INDEX_MAPPINGS: Record<string, MappingTypeMapping> = {
  [STATION_INDEX]: {
    properties: {
      id: { type: "keyword" },
      name: { type: "text" },
      code: { type: "keyword" },
      city: { type: "text" },
      state: { type: "text" },
      createdAt: { type: "date" },
      updatedAt: { type: "date" },
    },
  },
  [TRAIN_INDEX]: {
    properties: {
      id: { type: "keyword" },
      name: { type: "text" },
      number: { type: "keyword" },
      coachName: { type: "keyword" },
      totalSeats: { type: "integer" },
      createdAt: { type: "date" },
      updatedAt: { type: "date" },
    },
  },
  [ROUTE_INDEX]: {
    properties: {
      id: { type: "keyword" },
      trainId: { type: "keyword" },
      trainName: { type: "text" },
      trainNumber: { type: "keyword" },
      stations: {
        type: "nested",
        properties: {
          stationId: { type: "keyword" },
          stationName: { type: "text" },
          stationCode: { type: "keyword" },
          stopNumber: { type: "integer" },
          arrivalTime: { type: "keyword" },
          departureTime: { type: "keyword" },
        },
      },
      createdAt: { type: "date" },
      updatedAt: { type: "date" },
    },
  },
  [SCHEDULE_INDEX]: {
    properties: {
      id: { type: "keyword" },
      trainId: { type: "keyword" },
      trainName: { type: "text" },
      trainNumber: { type: "keyword" },
      journeyDate: { type: "date" },
      departureTime: { type: "date" },
      arrivalTime: { type: "date" },
      createdAt: { type: "date" },
      updatedAt: { type: "date" },
    },
  },
};

async function ensureIndex(index: string, mappings: MappingTypeMapping) {
  const exists = await esClient.indices.exists({ index });
  if (!exists) {
    await esClient.indices.create({
      index,
      mappings,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
    });
    console.log(`Created index: ${index}`);
  }
}

export async function connectElasticsearch() {
  if (isConnected) return;

  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await esClient.ping();
      console.log("Connected to Elasticsearch");

      for (const [index, mappings] of Object.entries(INDEX_MAPPINGS)) {
        await ensureIndex(index, mappings);
      }

      isConnected = true;
      return;
    } catch (err) {
      retries++;
      console.error(
        `Failed to connect to Elasticsearch (attempt ${retries}/${maxRetries}):`,
        (err as Error).message,
      );
      if (retries < maxRetries) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  throw new Error("Could not connect to Elasticsearch after multiple retries");
}

export async function disconnectElasticsearch() {
  if (isConnected) {
    await esClient.close();
    isConnected = false;
    console.log("Disconnected from Elasticsearch");
  }
}
