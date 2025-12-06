import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import { docClient } from "../utils/dynamodb"
import { successResponse, errorResponse } from "../utils/response"
import { verifyPin } from "../utils/pin"
import { createCvvUnlockToken } from "../utils/cvv-unlock-token"
import type { User } from "../types/user"

interface VerifyPinRequest {
  userId: string
  pin: string
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: VerifyPinRequest = JSON.parse(event.body)

    if (!body.userId || !body.pin) {
      return errorResponse("VALIDATION_ERROR", "userId and pin are required")
    }

    const userTableName = process.env.USER_TABLE_NAME!

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

    if (!user.securityPinHash) {
      return errorResponse("NOT_FOUND", "PIN not configured for user", undefined, 404)
    }

    const isValid = await verifyPin(body.pin, user.securityPinHash)

    if (!isValid) {
      // Aquí podrías manejar conteo de intentos fallidos
      return errorResponse("UNAUTHORIZED", "Invalid PIN", undefined, 401)
    }

    const token = createCvvUnlockToken(user.uuid, 60)

    return successResponse({
      cvvUnlockToken: token,
      expiresInSeconds: 60,
    })
  } catch (error) {
    console.error("[security-pin-verify-cvv] error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to verify PIN", undefined, 500)
  }
}
