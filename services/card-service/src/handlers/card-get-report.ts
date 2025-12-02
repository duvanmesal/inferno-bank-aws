import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { docClient, QueryCommand } from "../utils/dynamodb"
import { uploadToS3 } from "../utils/s3"
import { sendSQSMessage } from "../utils/sqs"
import { successResponse, errorResponse } from "../utils/response"
import { generateCSV, generateHTML } from "../utils/report-generator"
import type { Transaction, ReportRequest } from "../types/transaction"
import type { Card } from "../types/card"

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const cardId = event.pathParameters?.card_id

    if (!cardId) {
      return errorResponse("VALIDATION_ERROR", "card_id is required")
    }

    if (!event.body) {
      return errorResponse("VALIDATION_ERROR", "Request body is required")
    }

    const body: ReportRequest = JSON.parse(event.body)

    if (!body.start || !body.end) {
      return errorResponse("VALIDATION_ERROR", "start and end dates are required")
    }

    // Validate date format
    const startDate = new Date(body.start)
    const endDate = new Date(body.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return errorResponse("VALIDATION_ERROR", "Invalid date format")
    }

    if (startDate > endDate) {
      return errorResponse("VALIDATION_ERROR", "start date must be before end date")
    }

    const cardTableName = process.env.CARD_TABLE_NAME!
    const transactionTableName = process.env.TRANSACTION_TABLE_NAME!

    // Get card to verify it exists and get user_id
    const cardsResult = await docClient.send(
      new QueryCommand({
        TableName: cardTableName,
        KeyConditionExpression: "#uuid = :uuid",
        ExpressionAttributeNames: {
          "#uuid": "uuid",
        },
        ExpressionAttributeValues: {
          ":uuid": cardId,
        },
      }),
    )

    if (!cardsResult.Items || cardsResult.Items.length === 0) {
      return errorResponse("NOT_FOUND", "Card not found", undefined, 404)
    }

    const card = cardsResult.Items[0] as Card

    // Query transactions for the card within date range
    const transactionsResult = await docClient.send(
      new QueryCommand({
        TableName: transactionTableName,
        IndexName: "card-transactions-index",
        KeyConditionExpression: "cardId = :cardId AND createdAt BETWEEN :start AND :end",
        ExpressionAttributeValues: {
          ":cardId": cardId,
          ":start": body.start,
          ":end": body.end,
        },
      }),
    )

    const transactions = (transactionsResult.Items || []) as Transaction[]

    console.log(`[v0] Found ${transactions.length} transactions for card ${cardId}`)

    if (transactions.length === 0) {
      return successResponse({
        message: "No transactions found for the specified period",
        transactions: [],
      })
    }

    // Generate reports
    const csvContent = generateCSV(transactions)
    const htmlContent = generateHTML(transactions)

    const timestamp = Date.now()
    const reportBucket = process.env.REPORTS_BUCKET!

    // Upload CSV
    const csvKey = `reports/${cardId}/${timestamp}.csv`
    const csvUrl = await uploadToS3(reportBucket, csvKey, Buffer.from(csvContent), "text/csv")

    // Upload HTML
    const htmlKey = `reports/${cardId}/${timestamp}.html`
    const htmlUrl = await uploadToS3(reportBucket, htmlKey, htmlContent, "text/html")

    // Send notification
    const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!
    await sendSQSMessage(notificationQueueUrl, {
      userId: card.user_id,
      email: "",
      type: "REPORT.ACTIVITY",
      data: {
        cardId: cardId,
        reportPeriod: {
          start: body.start,
          end: body.end,
        },
        transactionCount: transactions.length,
        csvUrl: csvUrl,
        htmlUrl: htmlUrl,
      },
    })

    return successResponse({
      message: "Report generated successfully",
      period: {
        start: body.start,
        end: body.end,
      },
      transactionCount: transactions.length,
      reports: {
        csv: csvUrl,
        html: htmlUrl,
      },
    })
  } catch (error) {
    console.error("[v0] Report generation error:", error)
    return errorResponse("INTERNAL_ERROR", "Failed to generate report", undefined, 500)
  }
}
