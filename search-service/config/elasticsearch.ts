export const STATION_INDEX = "stations";
export const TRAIN_INDEX = "trains";
export const ROUTE_INDEX = "routes";
export const SCHEDULE_INDEX = "schedules";

const ES_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";

async function esRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(`${ES_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ES ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const INDEX_MAPPINGS: Record<string, object> = {
  [STATION_INDEX]: {
    mappings: {
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
    settings: { number_of_shards: 1, number_of_replicas: 0 },
  },
  [TRAIN_INDEX]: {
    mappings: {
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
    settings: { number_of_shards: 1, number_of_replicas: 0 },
  },
  [ROUTE_INDEX]: {
    mappings: {
      properties: {
        id: { type: "keyword" },
        trainId: { type: "keyword" },
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
    settings: { number_of_shards: 1, number_of_replicas: 0 },
  },
  [SCHEDULE_INDEX]: {
    mappings: {
      properties: {
        id: { type: "keyword" },
        trainId: { type: "keyword" },
        journeyDate: { type: "date" },
        departureTime: { type: "date" },
        arrivalTime: { type: "date" },
        createdAt: { type: "date" },
        updatedAt: { type: "date" },
      },
    },
    settings: { number_of_shards: 1, number_of_replicas: 0 },
  },
};

async function indexExists(index: string): Promise<boolean> {
  const res = await fetch(`${ES_URL}/${index}`, { method: "HEAD" });
  return res.status === 200;
}

export async function connectElasticsearch() {
  const maxRetries = 5;

  for (let i = 1; i <= maxRetries; i++) {
    try {
      await esRequest("GET", "/");
      console.log("Connected to Elasticsearch");
      for (const [index, config] of Object.entries(INDEX_MAPPINGS)) {
        const exists = await indexExists(index);
        if (!exists) {
          await esRequest("PUT", `/${index}`, config);
          console.log(`Created index: ${index}`);
        }
      }
      return;
    } catch (err) {
      console.error(
        `Failed to connect to Elasticsearch (attempt ${i}/${maxRetries}):`,
        (err as Error).message,
      );
      if (i < maxRetries) await new Promise((r) => setTimeout(r, 3000));
    }
  }

  throw new Error("Could not connect to Elasticsearch after multiple retries");
}

export async function disconnectElasticsearch() {
  console.log("Disconnected from Elasticsearch");
}

export async function indexDocument(
  index: string,
  id: string,
  body: Record<string, unknown>,
) {
  await esRequest("PUT", `/${index}/_doc/${id}?refresh=wait_for`, body);
  console.log(`Indexed document ${id} into ${index}`);
}

export async function searchIndex(
  index: string,
  query: string,
): Promise<unknown[]> {
  const result: any = await esRequest("POST", `/${index}/_search`, {
    query: {
      multi_match: {
        query,
        fields: ["*"],
        fuzziness: "AUTO",
      },
    },
    size: 20,
  });
  return result?.hits?.hits?.map((h: any) => h._source) ?? [];
}
