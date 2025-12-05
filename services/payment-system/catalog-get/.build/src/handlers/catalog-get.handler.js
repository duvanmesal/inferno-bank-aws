import { RedisRepository } from "../repositories/RedisRepository.js";
import { CatalogGetService } from "../services/CatalogGetService.js";
import { httpResponse } from "../utils/httpResponse.js";

const redisRepo = new RedisRepository();
const service = new CatalogGetService(redisRepo);

export const handler = async () => {
  try {
    const result = await service.process();
    return httpResponse(200, result);
  } catch (err) {
    console.error("❌ Error en catalog-get:", err);
    return httpResponse(500, { message: "Internal server error" });
  }
};
