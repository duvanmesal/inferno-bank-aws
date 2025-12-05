import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { env } from "../config/env.js";

const sqs = new SQSClient({});

export class QueueService {
  async enqueueCheckBalance(traceId) {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: env.CHECK_BALANCE_QUEUE_URL,
        MessageBody: JSON.stringify({ traceId })
      })
    );
  }
}
