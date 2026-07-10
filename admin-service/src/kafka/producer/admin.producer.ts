import { connectProducer, producer } from "../../config/kafka";
import { logger } from "../../config/logger";
import { TOPICS } from "../../constants";

export class AdminProducer {
  private isInitialized = false;

  async initialize() {
    if (!this.isInitialized) {
      await connectProducer();
      this.isInitialized = true;
    }
  }

  async sendMessage(topic: string, key: string, data: Record<string, unknown>) {
    await this.initialize();

    const messageToSend = {
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(data),
          timestamp: Date.now().toString(),
        },
      ],
    };

    const result = await producer.send(messageToSend);
    const firstMessage = messageToSend.messages[0];
    const metadata = result[0];
    logger.info(`Message sent to topic ${topic}`, {
      key: firstMessage?.key,
      partition: metadata?.partition,
      offset: metadata?.offset,
    });
    return result;
  }

  async stationCreated(station: {
    id: string;
    name: string;
    code: string;
    city: string;
    state: string;
  }) {
    return this.sendMessage(TOPICS.STATION_CREATED, `station:${station.id}`, {
      event: TOPICS.STATION_CREATED,
      data: station,
      timestamp: new Date().toISOString(),
    });
  }

  async trainCreated(train: {
    id: string;
    name: string;
    number: string;
    coachName: string;
    totalSeats: number;
  }) {
    return this.sendMessage(TOPICS.TRAIN_CREATED, `train:${train.id}`, {
      event: TOPICS.TRAIN_CREATED,
      data: train,
      timestamp: new Date().toISOString(),
    });
  }

  async routeCreated(route: {
    id: string;
    trainId: string;
    stations: {
      stationId: string;
      stationName: string;
      stationCode: string;
      stopNumber: number;
      arrivalTime: string | null;
      departureTime: string | null;
    }[];
  }) {
    return this.sendMessage(TOPICS.ROUTE_CREATED, `route:${route.id}`, {
      event: TOPICS.ROUTE_CREATED,
      data: route,
      timestamp: new Date().toISOString(),
    });
  }

  async scheduleCreated(schedule: {
    id: string;
    trainId: string;
    trainNumber: string;
    journeyDate: string;
    departureTime: string;
    arrivalTime: string;
  }) {
    return this.sendMessage(TOPICS.SCHEDULE_CREATED, `schedule:${schedule.id}`, {
      event: TOPICS.SCHEDULE_CREATED,
      data: schedule,
      timestamp: new Date().toISOString(),
    });
  }
}
