const { docClient, GetCommand, UpdateCommand } = require("../utils/dynamodb")

const TABLE_NAME = process.env.PAYMENT_TABLE_NAME

if (!TABLE_NAME) {
  console.warn(
    "[PaymentRepository] PAYMENT_TABLE_NAME env var is not set. Repository will not work correctly.",
  )
}

class PaymentRepository {
  constructor() {
    this.tableName = TABLE_NAME
  }

  async getByTraceId(traceId) {
    console.log(`[PaymentRepository] getByTraceId traceId=${traceId}`)

    const result = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { traceId },
      }),
    )

    if (!result.Item) {
      console.log(`[PaymentRepository] Payment not found traceId=${traceId}`)
      return null
    }

    return result.Item
  }

  buildError(message, logs) {
    const safeLogs = Array.isArray(logs) ? logs : []
    return {
      message: message || null,
      logs: safeLogs,
    }
  }

  async markAsInProgress(traceId, logs) {
    const now = new Date().toISOString()
    const error = this.buildError(null, logs)

    console.log(
      `[PaymentRepository] markAsInProgress traceId=${traceId}, logsCount=${error.logs.length}`,
    )

    const update = {
      TableName: this.tableName,
      Key: { traceId },
      UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt, #error = :error",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        "#error": "error",
      },
      ExpressionAttributeValues: {
        ":status": "IN_PROGRESS",
        ":updatedAt": now,
        ":error": error,
      },
    }

    await docClient.send(new UpdateCommand(update))
  }

  async markAsFinished(traceId, logs) {
    const now = new Date().toISOString()
    const error = this.buildError(null, logs)

    console.log(
      `[PaymentRepository] markAsFinished traceId=${traceId}, logsCount=${error.logs.length}`,
    )

    const update = {
      TableName: this.tableName,
      Key: { traceId },
      UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt, #error = :error",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        "#error": "error",
      },
      ExpressionAttributeValues: {
        ":status": "FINISH",
        ":updatedAt": now,
        ":error": error,
      },
    }

    await docClient.send(new UpdateCommand(update))
  }

  async markAsFailed(traceId, message, logs) {
    const now = new Date().toISOString()
    const error = this.buildError(message, logs)

    console.log(
      `[PaymentRepository] markAsFailed traceId=${traceId}, message="${message}", logsCount=${error.logs.length}`,
    )

    const update = {
      TableName: this.tableName,
      Key: { traceId },
      UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt, #error = :error",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        "#error": "error",
      },
      ExpressionAttributeValues: {
        ":status": "FAILED",
        ":updatedAt": now,
        ":error": error,
      },
    }

    await docClient.send(new UpdateCommand(update))
  }
}

module.exports = PaymentRepository
