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

  async getCatalog() {
    const ids = await this.client.hGetAll("catalog:index");

    let all = [];

    for (const id of Object.values(ids)) {
      const data = await this.client.hGetAll(`catalog:${id}`);
      all.push({
        id: Number(id),
        categoria: data.categoria,
        proveedor: data.proveedor,
        servicio: data.servicio,
        plan: data.plan,
        precio_mensual: Number(data.precio_mensual),
        detalles: data.detalles,
        estado: data.estado
      });
    }

    return all;
  }
}
