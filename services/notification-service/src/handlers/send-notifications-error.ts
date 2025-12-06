import type { SQSEvent, SQSRecord } from "aws-lambda"
import { v4 as uuidv4 } from "uuid"
import { docClient, PutCommand } from "../utils/dynamodb"
import type { NotificationErrorRecord, NotificationMessage } from "../types/notification"

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      await processFailedNotification(record)
    } catch (error) {
      console.error(" Error logging failed notification:", error)
    }
  }
}

async function processFailedNotification(record: SQSRecord): Promise<void> {
  console.log(" Processing failed notification:", record.body)

  let notificationType: any = "UNKNOWN"
  let message: NotificationMessage | null = null

  try {
    message = JSON.parse(record.body) as NotificationMessage
    notificationType = message?.type ?? "UNKNOWN"
  } catch {
    // Keep default
  }

  const errorRecord: NotificationErrorRecord = {
    uuid: uuidv4(),
    type: notificationType,
    payload: message ? JSON.stringify(message.data) : "",
    error: "Notification failed after max retries",
    messageBody: record.body,
    createdAt: new Date().toISOString(),
  }

  // Save to error table
  await docClient.send(
    new PutCommand({
      TableName: process.env.NOTIFICATION_ERROR_TABLE_NAME!,
      Item: errorRecord,
    }),
  )

  console.log(` Notification error record saved: ${errorRecord.uuid}`)
}
