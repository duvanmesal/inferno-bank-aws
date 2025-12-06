import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { docClient, UpdateCommand, GetCommand } from "../utils/dynamodb"
import { getSecret } from "../utils/secrets"
import { verifyToken, extractTokenFromHeader } from "../utils/jwt"
import { uploadToS3 } from "../utils/s3"
import { successResponse, errorResponse } from "../utils/response"
import { validateImageType, validateBase64 } from "../utils/validation"
import type { UploadAvatarRequest, User } from "../types/user"

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
      return errorResponse("FORBIDDEN", "Cannot upload avatar for another user", undefined, 403)
    }

    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: UploadAvatarRequest = JSON.parse(event.body)

    // Validate required fields
    if (!body.image || !body.fileType) {
      return errorResponse("VALIDATION_ERROR", "image and fileType are required")
    }

    // Validate file type
    if (!validateImageType(body.fileType)) {
      return errorResponse("VALIDATION_ERROR", "Invalid file type. Allowed: image/jpeg, image/jpg, image/png")
    }

    // Validate base64
    if (!validateBase64(body.image)) {
      return errorResponse("VALIDATION_ERROR", "Invalid base64 image data")
    }

    const tableName = process.env.USER_TABLE_NAME!

    // Get current user
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

    // Decode base64 to buffer
    const imageBuffer = Buffer.from(body.image, "base64")

    // Generate S3 key
    const timestamp = Date.now()
    const extension = body.fileType.split("/")[1]
    const s3Key = `avatars/${userId}/${timestamp}.${extension}`

    // Upload to S3
    const bucketName = process.env.AVATARS_BUCKET!
    const imageUrl = await uploadToS3(bucketName, s3Key, imageBuffer, body.fileType)

    // Update user with image URL
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          uuid: userId,
          document: user.document,
        },
        UpdateExpression: "SET #image = :image, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#image": "image",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":image": imageUrl,
          ":updatedAt": new Date().toISOString(),
        },
      }),
    )

    return successResponse({ imageUrl })
  } catch (error) {
    console.error(" Upload avatar error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to upload avatar", undefined, 500)
  }
}
