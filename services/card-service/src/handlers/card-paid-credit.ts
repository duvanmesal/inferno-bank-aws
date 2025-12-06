import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { v4 as uuidv4 } from "uuid"
import { docClient, QueryCommand, UpdateCommand, PutCommand } from "../utils/dynamodb"
import { sendSQSMessage } from "../utils/sqs"
import { successResponse, errorResponse } from "../utils/response"
import type { Card } from "../types/card"
import type { Transaction, PaymentRequest } from "../types/transaction"

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const cardId = event.pathParameters?.card_id

    if (!cardId) {
      return errorResponse("VALIDATION_ERROR", "card_id is required")
    }

    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: PaymentRequest = JSON.parse(event.body)

    if (!body.merchant || body.amount === undefined) {
      return errorResponse("VALIDATION_ERROR", "merchant and amount are required")
    }

    if (body.amount <= 0) {
      return errorResponse("VALIDATION_ERROR", "Amount must be greater than 0")
    }

    const cardTableName = process.env.CARD_TABLE_NAME!
    const transactionTableName = process.env.TRANSACTION_TABLE_NAME!

    // Get card
    const cardsResult = await docClient.send(
      new QueryCommand({
        TableName: cardTableName,
        KeyConditionExpression: "#uuid = :uuid",
        ExpressionAttributeNames: {
          "#uuid": "uuid",
        },
        ExpressionAttributeValues: {
          ":uuid": cardId,
        },
      }),
    )

    if (!cardsResult.Items || cardsResult.Items.length === 0) {
      return errorResponse("NOT_FOUND", "Card not found", undefined, 404)
    }

    const card = cardsResult.Items[0] as Card

    // Validate card type (only CREDIT can make payments)
    if (card.type !== "CREDIT") {
      return errorResponse("FORBIDDEN", "Payments are only allowed for credit cards", { cardType: card.type }, 403)
    }

    // Validate card status
    if (card.status !== "ACTIVATED") {
      return errorResponse("FORBIDDEN", "Card is not activated", { status: card.status }, 403)
    }

    // Update card used balance (reduce debt)
    const newUsedBalance = Math.max(0, card.usedBalance - body.amount)
    const actualPayment = card.usedBalance - newUsedBalance

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

    // Create transaction record
    const transactionId = uuidv4()
    const now = new Date().toISOString()

    const transaction: Transaction = {
      uuid: transactionId,
      cardId: cardId,
      amount: actualPayment,
      merchant: body.merchant,
      type: "PAYMENT_BALANCE",
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
      type: "TRANSACTION.PAID",
      data: {
        transactionId: transactionId,
        cardId: cardId,
        merchant: body.merchant,
        amount: actualPayment,
        remainingDebt: newUsedBalance,
        availableCredit: card.balance - newUsedBalance,
      },
    })

    return successResponse(
      {
        message: "Payment successful",
        transaction: {
          uuid: transactionId,
          amount: actualPayment,
          merchant: body.merchant,
          type: "PAYMENT_BALANCE",
          createdAt: now,
        },
        remainingDebt: newUsedBalance,
        availableCredit: card.balance - newUsedBalance,
      },
      201,
    )
  } catch (error) {
    console.error(" Payment error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to process payment", undefined, 500)
  }
}
