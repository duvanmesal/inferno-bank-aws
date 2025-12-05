import { StartPaymentMessageDto } from "../dto/StartPaymentMessageDto.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { QueueService } from "../services/QueueService.js";
import { StartPaymentService } from "../services/StartPaymentService.js";
import { ValidationError } from "../errors/ValidationError.js";

const paymentRepo = new PaymentRepository();
const queueService = new QueueService();
const service = new StartPaymentService(paymentRepo, queueService);

export const handler = async (event) => {
  try {
    if (!event.Records || event.Records.length === 0) {
      console.error("No messages received");
      return;
    }

    for (const record of event.Records) {
      try {
        const dto = StartPaymentMessageDto.fromSqsRecord(record);
        const result = await service.process(dto);
        console.log("✔ Message processed:", result);
      } catch (err) {
        console.error("❌ Error processing message:", err);
      }
    }
  } catch (err) {
    console.error("❌ UNCAUGHT ERROR:", err);
  }
};
