import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import { docClient } from "../utils/dynamodb"
import { successResponse, errorResponse } from "../utils/response"
import type { Card } from "../types/card"
import { verifyCvvUnlockToken } from "../utils/cvv-unlock-token"

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const cardNumber =
      event.pathParameters?.cardNumber ||
      event.pathParameters?.card_number

    if (!cardNumber) {
      return errorResponse("VALIDATION_ERROR", "cardNumber is required")
    }

    const cardTableName = process.env.CARD_TABLE_NAME!

    const result = await docClient.send(
      new QueryCommand({
        TableName: cardTableName,
        IndexName: "card-number-index",
        KeyConditionExpression: "#cardNumber = :cardNumber",
        ExpressionAttributeNames: {
          "#cardNumber": "cardNumber",
        },
        ExpressionAttributeValues: {
          ":cardNumber": cardNumber,
        },
        Limit: 1,
      }),
    )

    if (!result.Items || result.Items.length === 0) {
      return errorResponse("NOT_FOUND", "Card not found", undefined, 404)
    }

    const card = result.Items[0] as Card

    // 🔐 Validar token temporal para ver CVV
    const unlockToken =
      event.headers["X-CVV-UNLOCK"] ||
      event.headers["x-cvv-unlock"]
    const unlockedUserId = verifyCvvUnlockToken(
      Array.isArray(unlockToken) ? unlockToken[0] : unlockToken,
    )

    const canSeeCvv = unlockedUserId === card.user_id

    const base = {
      cardId: card.uuid,
      userId: card.user_id,
      type: card.type,
      status: card.status,
      balance: card.balance,
      usedBalance: card.usedBalance,
      availableBalance: card.balance - card.usedBalance,
      createdAt: card.createdAt,
      cardNumber: card.cardNumber,
      expiration: card.expiration,
      brand: card.brand,
      last4: card.last4,
    }

    const responseBody = canSeeCvv
      ? { ...base, cvv: card.cvv }
      : base

    return successResponse(responseBody)
  } catch (error) {
    console.error("[card-get-by-number] error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to get card by number", undefined, 500)
  }
}
