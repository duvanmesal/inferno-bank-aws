import { RedisRepository } from "../repositories/RedisRepository.js";

const redisRepo = new RedisRepository();

export const handler = async () => {
  try {
    const items = await redisRepo.getCatalog();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(items),
    };
  } catch (err) {
    console.error("❌ Error en catalog-get:", err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error",
        error: err.message ?? String(err),
      }),
    };
  }
};
