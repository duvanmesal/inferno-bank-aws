import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand
} from "@aws-sdk/client-dynamodb";
import { env } from "../config/env.js";

const dynamo = new DynamoDBClient({});

export class PaymentRepository {
  async createInitialPayment({ traceId, userId, cardId, service }) {
    const now = new Date().toISOString();

    const item = {
      traceId: { S: traceId },
      userId: { S: userId },
      cardId: { S: cardId },
      status: { S: "INITIAL" },
      service: { S: JSON.stringify(service) },
      error: { S: "" },
      createdAt: { S: now },
      updatedAt: { S: now }
    };

    await dynamo.send(
      new PutItemCommand({
        TableName: env.PAYMENT_TABLE_NAME,
        Item: item
      })
    );
  }

  async getPayment(traceId) {
    const res = await dynamo.send(
      new GetItemCommand({
        TableName: env.PAYMENT_TABLE_NAME,
        Key: { traceId: { S: traceId } }
      })
    );

    if (!res.Item) return null;

    return {
      traceId: res.Item.traceId.S,
      userId: res.Item.userId?.S ?? null,
      cardId: res.Item.cardId?.S ?? null,
      status: res.Item.status?.S ?? null,
      service: res.Item.service ? JSON.parse(res.Item.service.S) : null,
      error: res.Item.error?.S || null,
      createdAt: res.Item.createdAt?.S ?? null,
      updatedAt: res.Item.updatedAt?.S ?? null
    };
  }
}
