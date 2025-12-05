export const env = {
  CATALOG_BUCKET_NAME: process.env.CATALOG_BUCKET_NAME,
  // Opcional (de momento no tenemos tabla Dynamo específica para catálogo)
  CATALOG_TABLE_NAME: process.env.CATALOG_TABLE_NAME || "",
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: Number(process.env.REDIS_PORT),
  // ElastiCache no tiene password, así que esto normalmente será undefined
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
};
