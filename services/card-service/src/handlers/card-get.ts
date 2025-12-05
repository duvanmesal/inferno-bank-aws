import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { docClient, QueryCommand } from "../utils/dynamodb"
import { successResponse, errorResponse } from "../utils/response"
import type { Card } from "../types/card"

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const cardId =
      event.pathParameters?.cardId ||
      event.pathParameters?.card_id

    if (!cardId) {
      return errorResponse("VALIDATION_ERROR", "cardId is required")
    }

    const cardTableName = process.env.CARD_TABLE_NAME!

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
        Limit: 1,
      }),
    )

    if (!cardsResult.Items || cardsResult.Items.length === 0) {
      return errorResponse("NOT_FOUND", "Card not found", undefined, 404)
    }

    const card = cardsResult.Items[0] as Card

    const responseBody = {
      cardId: card.uuid,
      userId: card.user_id,           // 👈 LO QUE NECESITA payment-system
      type: card.type,
      status: card.status,
      balance: card.balance,
      usedBalance: card.usedBalance,
      availableBalance: card.balance - card.usedBalance,
      createdAt: card.createdAt,
    }

    return successResponse(responseBody)
  } catch (error) {
    console.error("[card-get] error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to get card", undefined, 500)
  }
}
