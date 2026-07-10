import { connectProducer, producer } from "../../config/kafka";
import { logger } from "../../config/logger";

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
    return this.sendMessage("station.created", `station:${station.id}`, {
      event: "station.created",
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
    return this.sendMessage("train.created", `train:${train.id}`, {
      event: "train.created",
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
    return this.sendMessage("route.created", `route:${route.id}`, {
      event: "route.created",
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
    return this.sendMessage("schedule.created", `schedule:${schedule.id}`, {
      event: "schedule.created",
      data: schedule,
      timestamp: new Date().toISOString(),
    });
  }
}
