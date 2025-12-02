import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { docClient, UpdateCommand, GetCommand } from "../utils/dynamodb"
import { getSecret } from "../utils/secrets"
import { verifyToken, extractTokenFromHeader } from "../utils/jwt"
import { sendSQSMessage } from "../utils/sqs"
import { successResponse, errorResponse } from "../utils/response"
import type { UpdateProfileRequest, User } from "../types/user"
import type { NotificationMessage } from "../types/notification"

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify JWT token
    const token = extractTokenFromHeader(event.headers.Authorization || event.headers.authorization)

    if (!token) {
      return errorResponse("UNAUTHORIZED", "Missing authorization token", undefined, 401)
    }

    const jwtSecret = await getSecret(process.env.JWT_SECRET_ARN!)

    let payload
    try {
      payload = await verifyToken(token, jwtSecret.key)
    } catch {
      return errorResponse("UNAUTHORIZED", "Invalid or expired token", undefined, 401)
    }

    // Verify user_id matches token
    const userId = event.pathParameters?.user_id

    if (!userId || userId !== payload.sub) {
      return errorResponse("FORBIDDEN", "Cannot update another user profile", undefined, 403)
    }

    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: UpdateProfileRequest = JSON.parse(event.body)

    // At least one field must be provided
    if (!body.address && !body.phone) {
      return errorResponse("VALIDATION_ERROR", "At least one field (address or phone) must be provided")
    }

    const tableName = process.env.USER_TABLE_NAME!

    // Get current user to get document (needed for update)
    const getResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          uuid: userId,
          document: payload.document,
        },
      }),
    )

    if (!getResult.Item) {
      return errorResponse("NOT_FOUND", "User not found", undefined, 404)
    }

    const user = getResult.Item as User

    // Update user
    const updateExpression: string[] = []
    const expressionAttributeValues: Record<string, any> = {
      ":updatedAt": new Date().toISOString(),
    }
    const expressionAttributeNames: Record<string, string> = {}

    if (body.address !== undefined) {
      updateExpression.push("#address = :address")
      expressionAttributeValues[":address"] = body.address
      expressionAttributeNames["#address"] = "address"
    }

    if (body.phone !== undefined) {
      updateExpression.push("#phone = :phone")
      expressionAttributeValues[":phone"] = body.phone
      expressionAttributeNames["#phone"] = "phone"
    }

    updateExpression.push("#updatedAt = :updatedAt")
    expressionAttributeNames["#updatedAt"] = "updatedAt"

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          uuid: userId,
          document: user.document,
        },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
      }),
    )

    // Send update notification
    const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!

    const notification: NotificationMessage = {
      userId: user.uuid,
      email: user.email,
      type: "USER.UPDATE",
      data: {
        fullName: `${user.name} ${user.lastName}`,
        updatedFields: Object.keys(body),
      },
    }

    // Fire and forget
    sendSQSMessage(notificationQueueUrl, notification).catch((err) =>
      console.error("[v0] Failed to send notification:", err),
    )

    return successResponse({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to update profile", undefined, 500)
  }
}
