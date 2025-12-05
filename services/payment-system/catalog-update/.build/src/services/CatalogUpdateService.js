import { parseCsv } from "../utils/csvParser.js";

export class CatalogUpdateService {
  constructor(s3Client, catalogRepository, redisRepository) {
    this.s3 = s3Client;
    this.catalogRepository = catalogRepository;
    this.redisRepository = redisRepository;
  }

  async process(dto) {
    console.log("📥 Processing catalog file:", dto.key);

    // 1. Leer CSV desde S3
    const obj = await this.s3.getObject({
      Bucket: dto.bucket,
      Key: dto.key,
    });

    const csv = await obj.Body.transformToString("utf-8");
    console.log("📄 CSV length:", csv.length);

    // 2. Parsear CSV
    let rows = parseCsv(csv);

    if (!rows || !rows.length) {
      console.warn("⚠️ CSV sin filas de datos");
      return;
    }

    // 3. Normalizar estructura a un catálogo genérico
    const items = rows.map((raw, index) => {
      const id = Number(raw.id ?? index + 1);
      const nombre = raw.nombre ?? raw.servicio ?? "";
      const precioMensual = Number(raw.precio_mensual ?? raw.precio ?? 0);

      return {
        id,
        categoria: raw.categoria ?? "SERVICIO",
        proveedor: raw.proveedor ?? nombre,
        servicio: nombre,
        plan: raw.plan ?? "BÁSICO",
        precio_mensual: precioMensual,
        detalles: raw.detalles ?? "",
        estado: raw.estado ?? "ACTIVO",
      };
    });

    console.log("🧮 Items procesados:", items.length);

    // 4. Guardar en DynamoDB (si está configurado)
    await this.catalogRepository.replaceCatalog(items);

    // 5. Guardar en Redis
    await this.redisRepository.replaceCatalog(items);

    console.log("✔ Catálogo actualizado correctamente");
  }
}
