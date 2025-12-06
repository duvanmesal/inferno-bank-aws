import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { ScanCommand } from "@aws-sdk/lib-dynamodb"
import { docClient } from "../utils/dynamodb"
import { successResponse, errorResponse } from "../utils/response"
import type { Card } from "../types/card"
import { verifyCvvUnlockToken } from "../utils/cvv-unlock-token"

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const userId =
      event.pathParameters?.user_id ||
      event.pathParameters?.userId

    if (!userId) {
      return errorResponse("VALIDATION_ERROR", "userId is required")
    }

    const cardTableName = process.env.CARD_TABLE_NAME!

    const result = await docClient.send(
      new ScanCommand({
        TableName: cardTableName,
        FilterExpression: "#uid = :uid",
        ExpressionAttributeNames: {
          "#uid": "user_id",
        },
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      }),
    )

    const items = (result.Items || []) as Card[]

    // 🔐 Verificar si hay token de desbloqueo
    const unlockToken =
      event.headers["X-CVV-UNLOCK"] ||
      event.headers["x-cvv-unlock"]
    const unlockedUserId = verifyCvvUnlockToken(
      Array.isArray(unlockToken) ? unlockToken[0] : unlockToken,
    )

    const canSeeCvv = unlockedUserId === userId

    const cards = items.map((card) => {
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

      if (canSeeCvv) {
        return { ...base, cvv: card.cvv }
      }

      return base
    })

    return successResponse(cards)
  } catch (error) {
    console.error("[card-get-by-user] error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to get user cards", undefined, 500)
  }
}
