import type { SQSEvent, SQSRecord } from "aws-lambda"
import { v4 as uuidv4 } from "uuid"
import { docClient, PutCommand } from "../utils/dynamodb"
import type { CardErrorRecord } from "../types/queue"

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      await processFailedRecord(record)
    } catch (error) {
      console.error("[v0] Error logging failed card request:", error)
    }
  }
}

async function processFailedRecord(record: SQSRecord): Promise<void> {
  console.log("[v0] Processing failed card request:", record.body)

  const errorRecord: CardErrorRecord = {
    uuid: uuidv4(),
    userId: "unknown",
    request: "unknown",
    error: "Card creation failed after max retries",
    messageBody: record.body,
    createdAt: new Date().toISOString(),
  }

  try {
    const message = JSON.parse(record.body)
    errorRecord.userId = message.userId || "unknown"
    errorRecord.request = message.request || "unknown"
  } catch {
    // Keep defaults
  }

  // Save to error table
  await docClient.send(
    new PutCommand({
      TableName: process.env.CARD_ERROR_TABLE_NAME!,
      Item: errorRecord,
    }),
  )

  console.log(`[v0] Error record saved: ${errorRecord.uuid}`)
}
