// services/card-service/src/handlers/card-purchase.ts

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

    // 🔎 Validaciones básicas
    if (!body.merchant || typeof body.merchant !== "string") {
      return errorResponse("VALIDATION_ERROR", "merchant is required and must be a string")
    }

    if (!body.cardId || typeof body.cardId !== "string") {
      return errorResponse("VALIDATION_ERROR", "cardId is required and must be a string")
    }

    if (typeof body.amount !== "number" || body.amount <= 0) {
      return errorResponse("VALIDATION_ERROR", "amount must be a positive number")
    }

    const cardTableName = process.env.CARD_TABLE_NAME!
    const transactionTableName = process.env.TRANSACTION_TABLE_NAME!

    // 📥 Obtener tarjeta por uuid
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

    // 🔐 Validar estado de la tarjeta
    if (card.status !== "ACTIVATED") {
      return errorResponse("FORBIDDEN", "Card is not activated", { status: card.status }, 403)
    }

    const now = new Date().toISOString()

    // 🧮 Preparar actualización de saldo / crédito
    let updateExpression = "SET #updatedAt = :updatedAt"
    const expressionAttributeNames: Record<string, string> = {
      "#updatedAt": "updatedAt",
    }
    const expressionAttributeValues: Record<string, any> = {
      ":updatedAt": now,
    }

    if (card.type === "DEBIT") {
      // Debe tener saldo suficiente
      if (card.balance < body.amount) {
        return errorResponse(
          "FORBIDDEN",
          "Insufficient balance",
          {
            balance: card.balance,
            amount: body.amount,
          },
          403,
        )
      }

      const newBalance = card.balance - body.amount
      updateExpression += ", #balance = :balance"
      expressionAttributeNames["#balance"] = "balance"
      expressionAttributeValues[":balance"] = newBalance
    } else if (card.type === "CREDIT") {
      // Límite de crédito: balance = límite total, usedBalance = usado
      const availableCredit = card.balance - card.usedBalance

      if (availableCredit < body.amount) {
        return errorResponse(
          "FORBIDDEN",
          "Insufficient credit limit",
          {
            limit: card.balance,
            usedBalance: card.usedBalance,
            availableCredit,
            amount: body.amount,
          },
          403,
        )
      }

      const newUsedBalance = card.usedBalance + body.amount
      updateExpression += ", #usedBalance = :usedBalance"
      expressionAttributeNames["#usedBalance"] = "usedBalance"
      expressionAttributeValues[":usedBalance"] = newUsedBalance
    } else {
      return errorResponse("VALIDATION_ERROR", `Unsupported card type: ${card.type}`)
    }

    // 💾 Actualizar tarjeta en DynamoDB
    await docClient.send(
      new UpdateCommand({
        TableName: cardTableName,
        Key: {
          uuid: card.uuid,
          createdAt: card.createdAt,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    )

    // 🧾 Crear registro de transacción enriquecido
    const transactionId = uuidv4()

    const transaction: Transaction = {
      uuid: transactionId,
      cardId: card.uuid,
      amount: body.amount,
      merchant: body.merchant,
      type: "PURCHASE",
      createdAt: now,

      // 🔹 Nuevos campos
      userId: card.user_id,
      cardType: card.type,
      cardLast4: card.last4,
      source: body.source ?? "CARD_PURCHASE",
      paymentTraceId: body.paymentTraceId ?? null,
    }

    await docClient.send(
      new PutCommand({
        TableName: transactionTableName,
        Item: transaction,
      }),
    )

    // 📤 Notificación de compra
    const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!
    await sendSQSMessage(notificationQueueUrl, {
      userId: card.user_id,
      email: "", // notification-service resuelve el correo
      type: "TRANSACTION.PURCHASE",
      data: {
        transactionId,
        cardId: card.uuid,
        amount: body.amount,
        merchant: body.merchant,
        cardType: card.type,
      },
    })

    return successResponse(
      {
        message: "Purchase successful",
        transaction,
      },
      201,
    )
  } catch (error) {
    console.error(" Purchase error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to process purchase", undefined, 500)
  }
}
