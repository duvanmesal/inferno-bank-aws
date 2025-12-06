import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { docClient } from "../utils/dynamodb"
import { sendSQSMessage } from "../utils/sqs"
import { successResponse, errorResponse } from "../utils/response"
import type { Card } from "../types/card"
import { generateCardData } from "../utils/card-number"

interface ActivateRequest {
  userId: string
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: ActivateRequest = JSON.parse(event.body)

    if (!body.userId) {
      return errorResponse("VALIDATION_ERROR", "userId is required")
    }

    const cardTableName = process.env.CARD_TABLE_NAME!
    const transactionTableName = process.env.TRANSACTION_TABLE_NAME!

    // 🔎 Obtener tarjetas del usuario
    const cardsResult = await docClient.send(
      new QueryCommand({
        TableName: cardTableName,
        IndexName: "user-cards-index",
        KeyConditionExpression: "user_id = :userId",
        ExpressionAttributeValues: {
          ":userId": body.userId,
        },
      }),
    )

    if (!cardsResult.Items || cardsResult.Items.length === 0) {
      return errorResponse("NOT_FOUND", "No cards found for user", undefined, 404)
    }

    const cards = cardsResult.Items as Card[]
    const creditCard = cards.find((c) => c.type === "CREDIT")

    if (!creditCard) {
      return errorResponse("NOT_FOUND", "No credit card found for user", undefined, 404)
    }

    // Si ya está activada devolvemos info (idempotente)
    if (creditCard.status === "ACTIVATED") {
      return successResponse({
        message: "Credit card is already activated",
        card: {
          cardId: creditCard.uuid,
          status: creditCard.status,
          creditLimit: creditCard.balance,
          cardNumber: creditCard.cardNumber,
          expiration: creditCard.expiration,
          brand: creditCard.brand,
          last4: creditCard.last4,
          // cvv NO lo devolvemos aquí; el front debe usar el flujo de PIN
        },
      })
    }

    // 🧮 Contar compras (regla de mínimo 10 PURCHASE entre todas las tarjetas del usuario)
    let purchaseCount = 0

    for (const card of cards) {
      const txResult = await docClient.send(
        new QueryCommand({
          TableName: transactionTableName,
          IndexName: "card-transactions-index",
          KeyConditionExpression: "cardId = :cardId",
          ExpressionAttributeValues: {
            ":cardId": card.uuid,
          },
        }),
      )

      const items = (txResult.Items || []) as Array<{ type?: string }>

      purchaseCount += items.filter((tx) => tx.type === "PURCHASE").length
    }

    if (purchaseCount < 10) {
      return errorResponse(
        "FORBIDDEN",
        "Credit card activation requires at least 10 purchase transactions",
        { purchaseCount, requiredPurchases: 10 },
        403,
      )
    }

    const nowIso = new Date().toISOString()

    // Generar datos de tarjeta solo si no existen
    let cardNumber = creditCard.cardNumber
    let expiration = creditCard.expiration
    let brand = creditCard.brand
    let last4 = creditCard.last4

    if (!cardNumber) {
      const generated = generateCardData()
      cardNumber = generated.cardNumber
      expiration = generated.expiration
      brand = generated.brand
      last4 = generated.last4

      await docClient.send(
        new UpdateCommand({
          TableName: cardTableName,
          Key: {
            uuid: creditCard.uuid,
            createdAt: creditCard.createdAt,
          },
          UpdateExpression:
            "SET #status = :status, #updatedAt = :updatedAt, #cardNumber = :cardNumber, #expiration = :expiration, #cvv = :cvv, #brand = :brand, #last4 = :last4",
          ExpressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
            "#cardNumber": "cardNumber",
            "#expiration": "expiration",
            "#cvv": "cvv",
            "#brand": "brand",
            "#last4": "last4",
          },
          ExpressionAttributeValues: {
            ":status": "ACTIVATED",
            ":updatedAt": nowIso,
            ":cardNumber": generated.cardNumber,
            ":expiration": generated.expiration,
            ":cvv": generated.cvv,
            ":brand": generated.brand,
            ":last4": generated.last4,
          },
        }),
      )
    } else {
      // Ya tiene número: solo actualizar estado
      await docClient.send(
        new UpdateCommand({
          TableName: cardTableName,
          Key: {
            uuid: creditCard.uuid,
            createdAt: creditCard.createdAt,
          },
          UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":status": "ACTIVATED",
            ":updatedAt": nowIso,
          },
        }),
      )
    }

    // 📩 Notificación
    const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!
    await sendSQSMessage(notificationQueueUrl, {
      userId: body.userId,
      type: "CARD.ACTIVATE",
      data: {
        cardId: creditCard.uuid,
        creditLimit: creditCard.balance,
        last4,
      },
    })

    return successResponse({
      message: "Credit card activated successfully",
      card: {
        cardId: creditCard.uuid,
        status: "ACTIVATED",
        creditLimit: creditCard.balance,
        cardNumber,
        expiration,
        brand,
        last4,
      },
    })
  } catch (err) {
    console.error("[card-activate] error:", err)
    return errorResponse("INTERNAL_ERROR", "Failed to activate card", undefined, 500)
  }
}
