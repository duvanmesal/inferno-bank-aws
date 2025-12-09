import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});

export class QueueService {
  async enqueueStart(traceId) {
    // Leemos directo de process.env
    const queueUrl = process.env.START_PAYMENT_QUEUE_URL;

    console.log("[payment-api][QueueService] enqueueStart", {
      traceId,
      queueUrl,
    });

    if (!queueUrl) {
      throw new Error(
        "START_PAYMENT_QUEUE_URL is not set in environment variables",
      );
    }

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ traceId }),
      }),
    );
  }
}
