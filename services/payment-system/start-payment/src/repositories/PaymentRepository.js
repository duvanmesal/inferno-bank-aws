import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  GetItemCommand
} from "@aws-sdk/client-dynamodb";

import { env } from "../config/env.js";

const dynamo = new DynamoDBClient({});

export class PaymentRepository {
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
      userId: res.Item.userId.S,
      cardId: res.Item.cardId.S,
      service: JSON.parse(res.Item.service.S),
      status: res.Item.status.S,
      error: res.Item.error?.S ?? null,
      createdAt: res.Item.createdAt.S,
      updatedAt: res.Item.updatedAt.S
    };
  }

  async updateStatus(traceId, status) {
    const now = new Date().toISOString();

    await dynamo.send(
      new UpdateItemCommand({
        TableName: env.PAYMENT_TABLE_NAME,
        Key: { traceId: { S: traceId } },
        UpdateExpression: "SET #s = :s, updatedAt = :u",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": { S: status },
          ":u": { S: now }
        }
      })
    );
  }
}
