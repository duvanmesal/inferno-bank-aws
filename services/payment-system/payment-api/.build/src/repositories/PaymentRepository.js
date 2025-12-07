import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { env } from "../config/env.js";

const dynamo = new DynamoDBClient({});

export class PaymentRepository {
  constructor() {
    this.tableName = env.PAYMENT_TABLE_NAME;

    if (!this.tableName) {
      console.warn(
        "[PaymentRepository] PAYMENT_TABLE_NAME env var is not set. Repository will not work correctly.",
      );
    }
  }

  async createInitialPayment({ traceId, userId, cardId, service }) {
    if (!this.tableName) return;

    const now = new Date().toISOString();

    const item = {
      traceId: { S: traceId },
      userId: { S: userId },
      cardId: { S: cardId },
      status: { S: "INITIAL" },
      service: { S: JSON.stringify(service) },
      error: { S: "" },
      createdAt: { S: now },
      updatedAt: { S: now },
    };

    await dynamo.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );
  }

  async getPayment(traceId) {
    if (!this.tableName) return null;

    const res = await dynamo.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: { traceId: { S: traceId } },
      }),
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
      updatedAt: res.Item.updatedAt?.S ?? null,
    };
  }

  buildError(message, logs) {
    const safeLogs = Array.isArray(logs) ? logs : [];
    if (!message && safeLogs.length === 0) {
      return "";
    }

    return JSON.stringify({
      message: message || null,
      logs: safeLogs,
    });
  }

  async markAsFailed(traceId, message, logs) {
    if (!this.tableName) return;

    const now = new Date().toISOString();
    const errorJson = this.buildError(message, logs);

    await dynamo.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: { traceId: { S: traceId } },
        UpdateExpression:
          "SET #status = :status, #updatedAt = :updatedAt, #error = :error",
        ExpressionAttributeNames: {
          "#status": "status",
          "#updatedAt": "updatedAt",
          "#error": "error",
        },
        ExpressionAttributeValues: {
          ":status": { S: "FAILED" },
          ":updatedAt": { S: now },
          ":error": { S: errorJson },
        },
      }),
    );
  }
}
