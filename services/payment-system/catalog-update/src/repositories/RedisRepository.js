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

  async replaceCatalog(items) {
    await this.ready;

    const key = "catalog:services";

    // Mapear items => hash { id: JSON(item) }
    const hash = {};
    for (const item of items) {
      const field = String(item.id);
      hash[field] = JSON.stringify(item);
    }

    // Limpiar catálogo anterior
    await this.client.del(key);

    if (Object.keys(hash).length === 0) {
      console.log("ℹ️ No items to store in Redis catalog");
      return;
    }

    // Guardar todo en un solo HSET
    await this.client.hSet(key, hash);

    console.log("✔ Catálogo almacenado en Redis con", items.length, "items");
  }
}
