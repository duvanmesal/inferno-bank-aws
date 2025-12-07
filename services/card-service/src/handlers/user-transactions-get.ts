import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { docClient } from "../utils/dynamodb"
import { ScanCommand } from "@aws-sdk/lib-dynamodb"
import { successResponse, errorResponse } from "../utils/response"
import type { Transaction } from "../types/transaction"

/**
 * GET /users/{userId}/transactions
 *
 * Query params opcionales:
 * - from: string (ISO date) -> filtra createdAt >= from
 * - to: string (ISO date)   -> filtra createdAt <= to
 * - type: "PURCHASE" | "SAVING" | "PAYMENT_BALANCE"
 * - cardType: "DEBIT" | "CREDIT"
 * - source: "CARD_PURCHASE" | "SERVICE_PAYMENT" | "INTERNAL"
 * - limit: número máximo de registros
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const pathParams = event.pathParameters ?? {}
    const userId = (pathParams as any).userId || (pathParams as any).user_id

    if (!userId) {
      return errorResponse("VALIDATION_ERROR", "userId is required in path", undefined, 400)
    }

    const query = event.queryStringParameters ?? {}

    const from = query.from
    const to = query.to
    const type = query.type as Transaction["type"] | undefined
    const cardType = query.cardType as "DEBIT" | "CREDIT" | undefined
    const source = query.source as Transaction["source"] | undefined

    let limit: number | undefined = undefined
    if (query.limit) {
      const parsed = Number(query.limit)
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = parsed
      }
    }

    const transactionTableName = process.env.TRANSACTION_TABLE_NAME!
    const filterExpressions: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, any> = {}

    // Siempre filtramos por userId
    filterExpressions.push("#userId = :userId")
    expressionAttributeNames["#userId"] = "userId"
    expressionAttributeValues[":userId"] = userId

    if (type) {
      filterExpressions.push("#type = :type")
      expressionAttributeNames["#type"] = "type"
      expressionAttributeValues[":type"] = type
    }

    if (cardType) {
      filterExpressions.push("#cardType = :cardType")
      expressionAttributeNames["#cardType"] = "cardType"
      expressionAttributeValues[":cardType"] = cardType
    }

    if (source) {
      filterExpressions.push("#source = :source")
      expressionAttributeNames["#source"] = "source"
      expressionAttributeValues[":source"] = source
    }

    if (from) {
      filterExpressions.push("#createdAt >= :from")
      expressionAttributeNames["#createdAt"] = "createdAt"
      expressionAttributeValues[":from"] = from
    }

    if (to) {
      if (!expressionAttributeNames["#createdAt"]) {
        expressionAttributeNames["#createdAt"] = "createdAt"
      }
      filterExpressions.push("#createdAt <= :to")
      expressionAttributeValues[":to"] = to
    }

    const params: any = {
      TableName: transactionTableName,
      FilterExpression: filterExpressions.join(" AND "),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }

    const result = await docClient.send(new ScanCommand(params))

    let items = (result.Items || []) as Transaction[]

    items.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      return b.createdAt.localeCompare(a.createdAt)
    })

    if (limit && items.length > limit) {
      items = items.slice(0, limit)
    }

    return successResponse(
      {
        userId,
        count: items.length,
        items,
      },
      200,
    )
  } catch (error) {
    console.error(" Error getting user transactions:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to fetch user transactions", undefined, 500)
  }
}
