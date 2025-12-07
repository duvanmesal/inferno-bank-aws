import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({});

const TABLE_NAME = process.env.PAYMENT_TABLE_NAME;

if (!TABLE_NAME) {
  console.warn(
    "[PaymentRepository] PAYMENT_TABLE_NAME env var is not set. Repository will not work correctly.",
  );
}

export class PaymentRepository {
  constructor() {
    this.tableName = TABLE_NAME;
  }

  async getPayment(traceId) {
    if (!this.tableName) return null;

    const res = await dynamo.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: { traceId: { S: traceId } },
      }),
    );

    if (!res.Item) {
      console.log(
        `[PaymentRepository] Payment not found traceId=${traceId}`,
      );
      return null;
    }

    return {
      traceId,
      userId: res.Item.userId?.S ?? null,
      cardId: res.Item.cardId?.S ?? null,
      status: res.Item.status?.S ?? null,
      service: res.Item.service ? JSON.parse(res.Item.service.S) : null,
      error: res.Item.error
        ? JSON.parse(res.Item.error.S)
        : null,
      createdAt: res.Item.createdAt?.S ?? null,
      updatedAt: res.Item.updatedAt?.S ?? null,
    };
  }

  async getByTraceId(traceId) {
    // Alias para TransactionService
    return this.getPayment(traceId);
  }

  buildError(message, logs) {
    const safeLogs = Array.isArray(logs) ? logs : [];
    if (!message && safeLogs.length === 0) {
      return null;
    }

    return JSON.stringify({
      message: message || null,
      logs: safeLogs,
    });
  }

  async updateStatus(traceId, status, logs) {
    if (!this.tableName) return;

    const now = new Date().toISOString();
    const errorJson = this.buildError(null, logs);

    const exprNames = {
      "#status": "status",
      "#updatedAt": "updatedAt",
    };

    const exprValues = {
      ":status": { S: status },
      ":updatedAt": { S: now },
    };

    let updateExpression =
      "SET #status = :status, #updatedAt = :updatedAt";

    if (errorJson !== null) {
      exprNames["#error"] = "error";
      exprValues[":error"] = { S: errorJson };
      updateExpression += ", #error = :error";
    }

    await dynamo.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: { traceId: { S: traceId } },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
      }),
    );
  }

  async updateInProgress(traceId, logs) {
    // Usado por CheckBalanceService
    return this.markAsInProgress(traceId, logs);
  }

  async markAsInProgress(traceId, logs) {
    // Usado por TransactionService
    return this.updateStatus(traceId, "IN_PROGRESS", logs);
  }

  async markAsFinished(traceId, logs) {
    if (!this.tableName) return;

    const now = new Date().toISOString();
    const errorJson = this.buildError(null, logs);

    const exprNames = {
      "#status": "status",
      "#updatedAt": "updatedAt",
    };

    const exprValues = {
      ":status": { S: "FINISH" },
      ":updatedAt": { S: now },
    };

    let updateExpression =
      "SET #status = :status, #updatedAt = :updatedAt";

    if (errorJson !== null) {
      exprNames["#error"] = "error";
      exprValues[":error"] = { S: errorJson };
      updateExpression += ", #error = :error";
    }

    await dynamo.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: { traceId: { S: traceId } },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
      }),
    );
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
          ":error": {
            S:
              errorJson ??
              JSON.stringify({
                message,
                logs: Array.isArray(logs) ? logs : [],
              }),
          },
        },
      }),
    );
  }
}
