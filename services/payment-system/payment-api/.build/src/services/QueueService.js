import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { env } from "../config/env.js";

const sqs = new SQSClient({});

export class QueueService {
  async enqueueStart(traceId) {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: env.START_PAYMENT_QUEUE_URL,
        MessageBody: JSON.stringify({ traceId })
      })
    );
  }
}
