import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { v4 as uuidv4 } from "uuid"
import { docClient, PutCommand, QueryCommand } from "../utils/dynamodb"
import { getSecret } from "../utils/secrets"
import { hashPassword } from "../utils/password"
import { sendSQSMessage } from "../utils/sqs"
import { successResponse, errorResponse } from "../utils/response"
import { validateEmail, validatePassword, validateDocument } from "../utils/validation"
import type { RegisterRequest, User, UserResponse } from "../types/user"
import type { NotificationMessage } from "../types/notification"
import type { CreateCardRequest } from "../types/queue"

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: RegisterRequest = JSON.parse(event.body)

    // Validate required fields
    if (!body.name || !body.lastName || !body.email || !body.password || !body.document) {
      return errorResponse("VALIDATION_ERROR", "Missing required fields", {
        required: ["name", "lastName", "email", "password", "document"],
      })
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      return errorResponse("VALIDATION_ERROR", "Invalid email format")
    }

    // Validate password length
    if (!validatePassword(body.password)) {
      return errorResponse("VALIDATION_ERROR", "Password must be at least 8 characters")
    }

    // Validate document format
    if (!validateDocument(body.document)) {
      return errorResponse("VALIDATION_ERROR", "Invalid document format")
    }

    const tableName = process.env.USER_TABLE_NAME!

    // Check if email already exists
    const emailQuery = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": body.email,
        },
      }),
    )

    if (emailQuery.Items && emailQuery.Items.length > 0) {
      return errorResponse("CONFLICT", "Email already registered")
    }

    // Check if document already exists
    const documentQuery = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "document-index",
        KeyConditionExpression: "document = :document",
        ExpressionAttributeValues: {
          ":document": body.document,
        },
      }),
    )

    if (documentQuery.Items && documentQuery.Items.length > 0) {
      return errorResponse("CONFLICT", "Document already registered")
    }

    // Get password secret for bcrypt rounds
    const passwordSecret = await getSecret(process.env.PASSWORD_SECRET_ARN!)
    const bcryptRounds = passwordSecret.rounds || 10

    // Hash password
    const hashedPassword = await hashPassword(body.password, bcryptRounds)

    // Create user
    const uuid = uuidv4()
    const now = new Date().toISOString()

    const user: User = {
      uuid,
      name: body.name,
      lastName: body.lastName,
      email: body.email,
      password: hashedPassword,
      document: body.document,
      createdAt: now,
      updatedAt: now,
    }

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: user,
      }),
    )

    // Send card creation requests (DEBIT and CREDIT)
    const cardQueueUrl = process.env.CREATE_REQUEST_CARD_QUEUE!

    const debitRequest: CreateCardRequest = {
      userId: uuid,
      request: "DEBIT",
    }

    const creditRequest: CreateCardRequest = {
      userId: uuid,
      request: "CREDIT",
    }

    await Promise.all([sendSQSMessage(cardQueueUrl, debitRequest), sendSQSMessage(cardQueueUrl, creditRequest)])

    // Send welcome notification
    const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!

    const notification: NotificationMessage = {
      userId: uuid,
      email: body.email,
      type: "WELCOME",
      data: {
        fullName: `${body.name} ${body.lastName}`,
        email: body.email,
      },
    }

    await sendSQSMessage(notificationQueueUrl, notification)

    // Return user without password
    const userResponse: UserResponse = {
      uuid: user.uuid,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      document: user.document,
    }

    return successResponse(userResponse, 201)
  } catch (error) {
    console.error("[v0] Register error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to register user", undefined, 500)
  }
}
