import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";

import { env } from "../config/env.js";

const dynamo = new DynamoDBClient({});

export class CatalogRepository {
  async replaceCatalog(items) {
    // Si no hay tabla configurada, no hacemos nada (sólo Redis)
    if (!env.CATALOG_TABLE_NAME) {
      console.warn(
        "⚠️ No CATALOG_TABLE_NAME configured, skipping DynamoDB catalog write"
      );
      return;
    }

    if (!items || !items.length) {
      console.log("ℹ️ No items to store in DynamoDB catalog");
      return;
    }

    const batches = [];

    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }

    for (const batch of batches) {
      const request = {
        RequestItems: {
          [env.CATALOG_TABLE_NAME]: batch.map((item) => ({
            PutRequest: {
              Item: {
                id: { S: String(item.id) },
                categoria: { S: item.categoria ?? "" },
                proveedor: { S: item.proveedor ?? "" },
                servicio: { S: item.servicio ?? "" },
                plan: { S: item.plan ?? "" },
                precio_mensual: { N: String(item.precio_mensual ?? 0) },
                detalles: { S: item.detalles ?? "" },
                estado: { S: item.estado ?? "ACTIVO" },
              },
            },
          })),
        },
      };

      await dynamo.send(new BatchWriteItemCommand(request));
    }

    console.log("✔ Catálogo almacenado en DynamoDB");
  }
}
