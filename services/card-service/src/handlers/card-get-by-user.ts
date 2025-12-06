import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { docClient } from "../utils/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { successResponse, errorResponse } from "../utils/response";
import type { Card } from "../types/card";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId =
      event.pathParameters?.user_id ||
      event.pathParameters?.userId;

    if (!userId) {
      return errorResponse("VALIDATION_ERROR", "userId is required");
    }

    const cardTableName = process.env.CARD_TABLE_NAME!;
    
    // 🔎 Versión simple: escanear por user_id (para este proyecto está bien)
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
      })
    );

    const items = (result.Items || []) as Card[];

    const cards = items.map((card) => ({
      cardId: card.uuid,
      userId: card.user_id,
      type: card.type,
      status: card.status,
      balance: card.balance,
      usedBalance: card.usedBalance,
      availableBalance: card.balance - card.usedBalance,
      createdAt: card.createdAt,
    }));

    return successResponse(cards);
  } catch (error) {
    console.error("[card-get-by-user] error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to get user cards",
      undefined,
      500
    );
  }
};
