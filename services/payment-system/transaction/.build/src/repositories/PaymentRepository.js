import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand
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
      status: res.Item.status.S
    };
  }

  async markAsFailed(traceId, message) {
    await dynamo.send(
      new UpdateItemCommand({
        TableName: env.PAYMENT_TABLE_NAME,
        Key: { traceId: { S: traceId } },
        UpdateExpression: "SET #s = :s, error = :e",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": { S: "FAILED" },
          ":e": { S: message }
        }
      })
    );
  }

  async markAsFinished(traceId) {
    await dynamo.send(
      new UpdateItemCommand({
        TableName: env.PAYMENT_TABLE_NAME,
        Key: { traceId: { S: traceId } },
        UpdateExpression: "SET #s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": { S: "FINISH" }
        }
      })
    );
  }
}
