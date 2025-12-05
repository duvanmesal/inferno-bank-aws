import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { CatalogFileEventDto } from "../dto/CatalogFileEventDto.js";
import { CatalogRepository } from "../repositories/CatalogRepository.js";
import { RedisRepository } from "../repositories/RedisRepository.js";
import { CatalogUpdateService } from "../services/CatalogUpdateService.js";
import { env } from "../config/env.js";
import { httpResponse } from "../utils/httpResponse.js";

const s3 = new S3Client({});
const catalogRepo = new CatalogRepository();
const redisRepo = new RedisRepository();

const service = new CatalogUpdateService(
  {
    getObject: (params) => s3.send(new GetObjectCommand(params)),
  },
  catalogRepo,
  redisRepo
);

export const handler = async (event) => {
  console.log("📨 Event recibido en catalog-update:", JSON.stringify(event));

  try {
    // 1️⃣ Evento S3 (por si luego conectas el trigger directo desde S3)
    if (event?.Records?.[0]?.eventSource === "aws:s3") {
      console.log("📦 Evento S3 detectado");

      for (const record of event.Records) {
        const dto = CatalogFileEventDto.fromS3Record(record);
        await service.process(dto);
      }

      // No es integración HTTP, así que no hace falta respuesta especial
      return;
    }

    // 2️⃣ Evento HTTP (API Gateway → POST /catalog/update)
    const { body, isBase64Encoded } = event || {};

    if (!body) {
      return httpResponse(400, { message: "CSV body is required" });
    }

    const csvBuffer = isBase64Encoded
      ? Buffer.from(body, "base64")
      : Buffer.from(body, "utf-8");

    const bucket = env.CATALOG_BUCKET_NAME;
    if (!bucket) {
      console.error("❌ CATALOG_BUCKET_NAME no está configurado");
      return httpResponse(500, {
        message: "Catalog bucket not configured",
      });
    }

    const key = `catalog/catalog-${Date.now()}.csv`;

    // 2.1 Guardar el CSV crudo en S3
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: csvBuffer,
        ContentType: "text/csv",
      })
    );

    console.log("📤 CSV subido a S3:", { bucket, key });

    // 2.2 Reutilizar el mismo flujo de negocio que el evento S3
    const dto = new CatalogFileEventDto({ bucket, key });
    await service.process(dto);

    // 2.3 Responder a API Gateway
    return httpResponse(200, {
      message: "Catalog updated successfully",
      bucket,
      key,
    });
  } catch (err) {
    console.error("❌ Error en catalog-update:", err);

    return httpResponse(500, {
      message: "Internal server error",
      error: err.message ?? String(err),
    });
  }
};
