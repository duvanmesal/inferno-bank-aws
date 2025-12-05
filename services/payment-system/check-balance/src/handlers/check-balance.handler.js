import { CheckBalanceMessageDto } from "../dto/CheckBalanceMessageDto.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { CoreBankService } from "../services/CoreBankService.js";
import { QueueService } from "../services/QueueService.js";
import { CheckBalanceService } from "../services/CheckBalanceService.js";

const paymentRepo = new PaymentRepository();
const coreBank = new CoreBankService();
const queueService = new QueueService();
const service = new CheckBalanceService(paymentRepo, coreBank, queueService);

export const handler = async (event) => {
  try {
    for (const record of event.Records) {
      try {
        const dto = CheckBalanceMessageDto.fromSqsRecord(record);
        await service.process(dto);
      } catch (err) {
        console.error("❌ Error processing message:", err);
      }
    }
  } catch (err) {
    console.error("❌ UNHANDLED ERROR:", err);
  }
};
