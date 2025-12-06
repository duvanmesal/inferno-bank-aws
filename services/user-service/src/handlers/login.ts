import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { docClient, QueryCommand } from "../utils/dynamodb"
import { getSecret } from "../utils/secrets"
import { comparePassword } from "../utils/password"
import { generateToken } from "../utils/jwt"
import { sendSQSMessage } from "../utils/sqs"
import { successResponse, errorResponse } from "../utils/response"
import { validateEmail } from "../utils/validation"
import type { LoginRequest, User } from "../types/user"
import type { NotificationMessage } from "../types/notification"

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: LoginRequest = JSON.parse(event.body)

    // Validate required fields
    if (!body.email || !body.password) {
      return errorResponse("VALIDATION_ERROR", "Email and password are required")
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      return errorResponse("VALIDATION_ERROR", "Invalid email format")
    }

    const tableName = process.env.USER_TABLE_NAME!

    // Find user by email
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": body.email,
        },
      }),
    )

    if (!result.Items || result.Items.length === 0) {
      return errorResponse("UNAUTHORIZED", "Invalid email or password", undefined, 401)
    }

    const user = result.Items[0] as User

    // Compare password
    const isPasswordValid = await comparePassword(body.password, user.password)

    if (!isPasswordValid) {
      return errorResponse("UNAUTHORIZED", "Invalid email or password", undefined, 401)
    }

    // Get JWT secret
    const jwtSecret = await getSecret(process.env.JWT_SECRET_ARN!)

    // Generate JWT token
    const token = await generateToken(
      {
        sub: user.uuid,
        email: user.email,
        document: user.document,
      },
      jwtSecret.key,
    )

    // Send login notification
    const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!

    const notification: NotificationMessage = {
      userId: user.uuid,
      email: user.email,
      type: "USER.LOGIN",
      data: {
        fullName: `${user.name} ${user.lastName}`,
        loginTime: new Date().toISOString(),
      },
    }

    // Fire and forget
    sendSQSMessage(notificationQueueUrl, notification).catch((err) =>
      console.error(" Failed to send notification:", err),
    )

    return successResponse({
      token,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error(" Login error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to login", undefined, 500)
  }
}
