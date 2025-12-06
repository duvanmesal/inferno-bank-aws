import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { v4 as uuidv4 } from "uuid"
import { docClient, UpdateCommand, PutCommand, QueryCommand } from "../utils/dynamodb"
import { sendSQSMessage } from "../utils/sqs"
import { successResponse, errorResponse } from "../utils/response"
import type { Card } from "../types/card"
import type { Transaction, PurchaseRequest } from "../types/transaction"

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: PurchaseRequest = JSON.parse(event.body)

    if (!body.merchant || !body.cardId || body.amount === undefined) {
      return errorResponse("VALIDATION_ERROR", "merchant, cardId, and amount are required")
    }

    if (body.amount <= 0) {
      return errorResponse("VALIDATION_ERROR", "Amount must be greater than 0")
    }

    const cardTableName = process.env.CARD_TABLE_NAME!
    const transactionTableName = process.env.TRANSACTION_TABLE_NAME!

    // Get card - need to query by uuid
    const cardsResult = await docClient.send(
      new QueryCommand({
        TableName: cardTableName,
        KeyConditionExpression: "#uuid = :uuid",
        ExpressionAttributeNames: {
          "#uuid": "uuid",
        },
        ExpressionAttributeValues: {
          ":uuid": body.cardId,
        },
      }),
    )

    if (!cardsResult.Items || cardsResult.Items.length === 0) {
      return errorResponse("NOT_FOUND", "Card not found", undefined, 404)
    }

    const card = cardsResult.Items[0] as Card

    // Check if card is activated
    if (card.status !== "ACTIVATED") {
      return errorResponse("FORBIDDEN", "Card is not activated", { status: card.status }, 403)
    }

    // Process based on card type
    if (card.type === "DEBIT") {
      if (card.balance < body.amount) {
        return errorResponse(
          "FORBIDDEN",
          "Insufficient balance",
          {
            available: card.balance,
            requested: body.amount,
          },
          403,
        )
      }

      // Update debit card balance
      const newBalance = card.balance - body.amount

      await docClient.send(
        new UpdateCommand({
          TableName: cardTableName,
          Key: {
            uuid: card.uuid,
            createdAt: card.createdAt,
          },
          UpdateExpression: "SET balance = :balance, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":balance": newBalance,
            ":updatedAt": new Date().toISOString(),
          },
        }),
      )
    } else if (card.type === "CREDIT") {
      const availableCredit = card.balance - card.usedBalance

      if (availableCredit < body.amount) {
        return errorResponse(
          "FORBIDDEN",
          "Insufficient credit",
          {
            available: availableCredit,
            requested: body.amount,
            limit: card.balance,
            used: card.usedBalance,
          },
          403,
        )
      }

      // Update credit card used balance
      const newUsedBalance = card.usedBalance + body.amount

      await docClient.send(
        new UpdateCommand({
          TableName: cardTableName,
          Key: {
            uuid: card.uuid,
            createdAt: card.createdAt,
          },
          UpdateExpression: "SET usedBalance = :usedBalance, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":usedBalance": newUsedBalance,
            ":updatedAt": new Date().toISOString(),
          },
        }),
      )
    }

    // Create transaction record
    const transactionId = uuidv4()
    const now = new Date().toISOString()

    const transaction: Transaction = {
      uuid: transactionId,
      cardId: body.cardId,
      amount: body.amount,
      merchant: body.merchant,
      type: "PURCHASE",
      createdAt: now,
    }

    await docClient.send(
      new PutCommand({
        TableName: transactionTableName,
        Item: transaction,
      }),
    )

    // Send notification
    const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!
    await sendSQSMessage(notificationQueueUrl, {
      userId: card.user_id,
      email: "",
      type: "TRANSACTION.PURCHASE",
      data: {
        transactionId: transactionId,
        cardId: body.cardId,
        merchant: body.merchant,
        amount: body.amount,
        cardType: card.type,
      },
    })

    return successResponse(
      {
        message: "Purchase successful",
        transaction: {
          uuid: transactionId,
          amount: body.amount,
          merchant: body.merchant,
          type: "PURCHASE",
          createdAt: now,
        },
      },
      201,
    )
  } catch (error) {
    console.error(" Purchase error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to process purchase", undefined, 500)
  }
}
