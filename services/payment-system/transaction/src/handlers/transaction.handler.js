import { TransactionMessageDto } from "../dto/TransactionMessageDto.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { CoreBankService } from "../services/CoreBankService.js";
import { TransactionService } from "../services/TransactionService.js";

const paymentRepo = new PaymentRepository();
const coreBank = new CoreBankService();
const service = new TransactionService(paymentRepo, coreBank);

export const handler = async (event) => {
  try {
    for (const record of event.Records) {
      try {
        const dto = TransactionMessageDto.fromSqsRecord(record);
        await service.process(dto);
      } catch (err) {
        console.error("❌ Error processing record:", err);
      }
    }
  } catch (err) {
    console.error("❌ Unhandled error:", err);
  }
};
