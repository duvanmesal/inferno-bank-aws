import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { docClient } from "../utils/dynamodb"
import { successResponse, errorResponse } from "../utils/response"
import { hashPin } from "../utils/pin"
import type { User } from "../types/user"

interface SetPinRequest {
  userId: string
  pin: string // 4–6 dígitos
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: SetPinRequest = JSON.parse(event.body)

    if (!body.userId || !body.pin) {
      return errorResponse("VALIDATION_ERROR", "userId and pin are required")
    }

    if (!/^\d{4,6}$/.test(body.pin)) {
      return errorResponse("VALIDATION_ERROR", "PIN must be 4-6 numeric digits")
    }

    const userTableName = process.env.USER_TABLE_NAME!

    // 🔎 Buscar usuario por uuid (hash key) usando Query
    const userResult = await docClient.send(
      new QueryCommand({
        TableName: userTableName,
        KeyConditionExpression: "#uuid = :uuid",
        ExpressionAttributeNames: {
          "#uuid": "uuid",
        },
        ExpressionAttributeValues: {
          ":uuid": body.userId,
        },
        Limit: 1,
      }),
    )

    if (!userResult.Items || userResult.Items.length === 0) {
      return errorResponse("NOT_FOUND", "User not found", undefined, 404)
    }

    const user = userResult.Items[0] as User

    const pinHash = await hashPin(body.pin)
    const nowIso = new Date().toISOString()

    await docClient.send(
      new UpdateCommand({
        TableName: userTableName,
        Key: {
          uuid: user.uuid,
          document: user.document,
        },
        UpdateExpression:
          "SET securityPinHash = :pinHash, securityPinUpdatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":pinHash": pinHash,
          ":updatedAt": nowIso,
        },
      }),
    )

    return successResponse({
      message: "Security PIN set successfully",
    })
  } catch (error) {
    console.error("[security-pin-set] error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to set PIN", undefined, 500)
  }
}
