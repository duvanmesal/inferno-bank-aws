import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { CatalogFileEventDto } from "../dto/CatalogFileEventDto.js";
import { CatalogRepository } from "../repositories/CatalogRepository.js";
import { RedisRepository } from "../repositories/RedisRepository.js";
import { CatalogUpdateService } from "../services/CatalogUpdateService.js";

const s3 = new S3Client({});
const catalogRepo = new CatalogRepository();
const redisRepo = new RedisRepository();
const service = new CatalogUpdateService(
  {
    getObject: (params) => s3.send(new GetObjectCommand(params))
  },
  catalogRepo,
  redisRepo
);

export const handler = async (event) => {
  try {
    for (const record of event.Records) {
      const dto = CatalogFileEventDto.fromS3Record(record);

      await service.process(dto);
    }
  } catch (err) {
    console.error("❌ Error en catalog-update:", err);
  }
};
