import type { SQSEvent, SQSRecord } from "aws-lambda"
import { v4 as uuidv4 } from "uuid"
import { docClient, PutCommand } from "../utils/dynamodb"
import { sendSQSMessage } from "../utils/sqs"
import type { Card } from "../types/card"
import type { CardRequestMessage } from "../types/queue"

const generateCreditScore = (): number => {
  return Math.floor(Math.random() * 101) // 0-100
}

const calculateCreditLimit = (score: number): number => {
  const minLimit = 100
  const maxLimit = 10000000
  return Math.floor(minLimit + (score / 100) * (maxLimit - minLimit))
}

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      await processRecord(record)
    } catch (error) {
      console.error(" Error processing card request:", error)
      // SQS will automatically retry and eventually send to DLQ
      throw error
    }
  }
}

async function processRecord(record: SQSRecord): Promise<void> {
  const message: CardRequestMessage = JSON.parse(record.body)
  const { userId, request } = message

  console.log(` Processing card request: ${request} for user: ${userId}`)

  const cardUuid = uuidv4()
  const now = new Date().toISOString()

  let card: Card

  if (request === "CREDIT") {
    const score = generateCreditScore()
    const creditLimit = calculateCreditLimit(score)

    console.log(` Credit score: ${score}, limit: ${creditLimit}`)

    card = {
      uuid: cardUuid,
      user_id: userId,
      type: "CREDIT",
      status: "PENDING",
      balance: creditLimit,
      usedBalance: 0,
      createdAt: now,
      updatedAt: now,
    }
  } else {
    // DEBIT card
    card = {
      uuid: cardUuid,
      user_id: userId,
      type: "DEBIT",
      status: "ACTIVATED",
      balance: 0,
      usedBalance: 0,
      createdAt: now,
      updatedAt: now,
    }
  }

  // Save card to DynamoDB
  await docClient.send(
    new PutCommand({
      TableName: process.env.CARD_TABLE_NAME!,
      Item: card,
    }),
  )

  console.log(` Card created: ${cardUuid}`)

  // Send notification
  const notificationQueueUrl = process.env.NOTIFICATION_EMAIL_QUEUE!
  await sendSQSMessage(notificationQueueUrl, {
    userId: userId,
    email: "", // Will be fetched by notification service
    type: "CARD.CREATE",
    data: {
      cardId: cardUuid,
      cardType: card.type,
      status: card.status,
      ...(card.type === "CREDIT" && { creditLimit: card.balance }),
    },
  })
}
