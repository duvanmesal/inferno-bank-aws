import { CheckBalanceMessageDto } from "../dto/CheckBalanceMessageDto.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { CoreBankService } from "../services/CoreBankService.js";
import { QueueService } from "../services/QueueService.js";
import { CheckBalanceService } from "../services/CheckBalanceService.js";
import { ValidationError } from "../errors/ValidationError.js";

const paymentRepo = new PaymentRepository();
const coreBank = new CoreBankService();
const queueService = new QueueService();
const service = new CheckBalanceService(paymentRepo, coreBank, queueService);

export const handler = async (event) => {
  try {
    if (!event.Records || event.Records.length === 0) {
      console.warn("[check-balance] No SQS records to process");
      return;
    }

    for (const record of event.Records) {
      try {
        const dto = CheckBalanceMessageDto.fromSqsRecord(record);
        await service.process(dto);
      } catch (err) {
        if (err instanceof ValidationError) {
          console.warn("[check-balance] Validation error:", err.message);
          continue;
        }

        console.error("[check-balance] Error processing record:", err);
      }
    }
  } catch (err) {
    console.error("[check-balance] UNCAUGHT ERROR:", err);
  }
};
