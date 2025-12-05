import { createClient } from "redis";
import { env } from "../config/env.js";

export class RedisRepository {
  constructor() {
    this.client = createClient({
      socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
      password: env.REDIS_PASSWORD,
    });

    this.client.on("error", (err) => {
      console.error("❌ Redis client error:", err);
    });

    this.ready = this.client.connect();
  }

  async getCatalog() {
    await this.ready;

    const key = "catalog:services";
    const hash = await this.client.hGetAll(key);

    // hash = { "1": "{...}", "2": "{...}" }
    const items = Object.values(hash).map((json) => {
      try {
        return JSON.parse(json);
      } catch {
        return null;
      }
    }).filter(Boolean);

    console.log("📤 Catalogo obtenido desde Redis:", items.length, "items");

    return items;
  }
}
