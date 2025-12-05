import { parseCsv } from "../utils/csvParser.js";

export class CatalogUpdateService {
  constructor(s3Client, catalogRepo, redisRepo) {
    this.s3 = s3Client;
    this.catalogRepo = catalogRepo;
    this.redisRepo = redisRepo;
  }

  async process(dto) {
    console.log("📥 Processing catalog file:", dto.key);

    // 1. Leer CSV desde S3
    const obj = await this.s3.getObject({
      Bucket: dto.bucket,
      Key: dto.key
    });

    const csvContent = await obj.Body.transformToString();

    // 2. Convertir CSV → JSON
    let items = parseCsv(csvContent);

    // 3. Asegurar datos numéricos correctos
    items = items.map(it => ({
      ...it,
      id: Number(it.id),
      precio_mensual: Number(it.precio_mensual)
    }));

    // 4. Guardar en DynamoDB
    await this.catalogRepo.replaceCatalog(items);

    // 5. Guardar en Redis
    await this.redisRepo.replaceCatalog(items);

    console.log("✔ Catálogo actualizado correctamente");
  }
}
