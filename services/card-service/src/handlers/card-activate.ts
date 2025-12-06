import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { docClient, QueryCommand, UpdateCommand } from "../utils/dynamodb"
import { sendSQSMessage } from "../utils/sqs"
import { successResponse, errorResponse } from "../utils/response"
import type { Card } from "../types/card"

interface ActivateRequest {
  userId: string
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: ActivateRequest = JSON.parse(event.body)

    if (!body.userId) {
      return errorResponse("VALIDATION_ERROR", "userId is required")
    }

    const transactionTableName = process.env.TRANSACTION_TABLE_NAME!
    const cardTableName = process.env.CARD_TABLE_NAME!

    // Get user's cards
    const cardsResult = await docClient.send(
      new QueryCommand({
        TableName: cardTableName,
        IndexName: "user-cards-index",
        KeyConditionExpression: "user_id = :userId",
        ExpressionAttributeValues: {
          ":userId": body.userId,
        },
      }),
    )

    if (!cardsResult.Items || cardsResult.Items.length === 0) {
      return errorResponse("NOT_FOUND", "No cards found for user", undefined, 404)
    }

    const cards = cardsResult.Items as Card[]
    const creditCard = cards.find((c) => c.type === "CREDIT")

    if (!creditCard) {
      return errorResponse("NOT_FOUND", "No credit card found for user", undefined, 404)
    }

    if (creditCard.status === "ACTIVATED") {
      return successResponse({
        message: "Credit card is already activated",
        card: {
          uuid: creditCard.uuid,
          status: creditCard.status,
        },
      })
    }

    // Count PURCHASE transactions for this user (from all cards)
    let purchaseCount = 0
    for (const card of cards) {
      const transactionsResult = await docClient.send(
        new QueryCommand({
          TableName: transactionTableName,
          IndexName: "card-transactions-index",
          KeyConditionExpression: "cardId = :cardId",
          FilterExpression: "#type = :type",
          ExpressionAttributeNames: {
            "#type": "type",
          },
          ExpressionAttributeValues: {
            ":cardId": card.uuid,
            ":type": "PURCHASE",
          },
        }),
      )

      purchaseCount += transactionsResult.Items?.length || 0
    }

    console.log(` User ${body.userId} has ${purchaseCount} purchase transactions`)

    if (purchaseCount < 10) {
      return errorResponse(
        "FORBIDDEN",
        "Credit card activation requires at least 10 purchase transactions",
        {
          currentPurchases: purchaseCount,
          requiredPurchases: 10,
        },
        403,
      )
    }

    // Activate credit card
    await docClient.send(
      new UpdateCommand({
        TableName: cardTableName,
        Key: {
          uuid: creditCard.uuid,
          createdAt: creditCard.createdAt,
        },
        UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":status": "ACTIVATED",
          ":updatedAt": new Date().toISOString(),
        },
      }),
    )

    // Send notification
    const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!
    await sendSQSMessage(notificationQueueUrl, {
      userId: body.userId,
      email: "",
      type: "CARD.ACTIVATE",
      data: {
        cardId: creditCard.uuid,
        creditLimit: creditCard.balance,
      },
    })

    return successResponse({
      message: "Credit card activated successfully",
      card: {
        uuid: creditCard.uuid,
        status: "ACTIVATED",
        creditLimit: creditCard.balance,
      },
    })
  } catch (error) {
    console.error(" Card activation error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to activate card", undefined, 500)
  }
}
