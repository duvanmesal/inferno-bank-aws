import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"

const client = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" })

export const sendSQSMessage = async (queueUrl: string, messageBody: any): Promise<void> => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody),
  })

  await client.send(command)
}
