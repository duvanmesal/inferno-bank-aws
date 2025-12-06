import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { docClient, QueryCommand } from "../utils/dynamodb"
import { getSecret } from "../utils/secrets"
import { verifyToken, extractTokenFromHeader } from "../utils/jwt"
import { successResponse, errorResponse } from "../utils/response"
import type { User, UserResponse } from "../types/user"

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

    const userId = event.pathParameters?.user_id

    if (!userId) {
      return errorResponse("VALIDATION_ERROR", "user_id is required")
    }

    const tableName = process.env.USER_TABLE_NAME!

    // Query user by uuid
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#uuid = :uuid",
        ExpressionAttributeNames: {
          "#uuid": "uuid",
        },
        ExpressionAttributeValues: {
          ":uuid": userId,
        },
      }),
    )

    if (!result.Items || result.Items.length === 0) {
      return errorResponse("NOT_FOUND", "User not found", undefined, 404)
    }

    const user = result.Items[0] as User

    // Return user without password
    const userResponse: UserResponse = {
      uuid: user.uuid,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      document: user.document,
      address: user.address,
      phone: user.phone,
      image: user.image,
    }

    return successResponse(userResponse)
  } catch (error) {
    console.error(" Get profile error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to get profile", undefined, 500)
  }
}
