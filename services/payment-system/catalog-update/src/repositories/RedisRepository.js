import redis from "redis";
import { env } from "../config/env.js";

export class RedisRepository {
  constructor() {
    this.client = redis.createClient({
      socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT
      },
      password: env.REDIS_PASSWORD
    });

    this.client.connect();
  }

  async replaceCatalog(items) {
    // Borramos todo
    await this.client.flushAll();

    for (const item of items) {
      await this.client.hSet(`catalog:${item.id}`, item);
    }

    await this.client.hSet("catalog:index", items.map(obj => obj.id));
  }
}
