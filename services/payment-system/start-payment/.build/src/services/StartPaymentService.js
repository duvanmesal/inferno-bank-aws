import { sleep } from "../utils/sleep.js";

export class StartPaymentService {
  constructor(paymentRepo, queueService) {
    this.paymentRepo = paymentRepo;
    this.queueService = queueService;
  }

  async process(messageDto) {
    const payment = await this.paymentRepo.getPayment(messageDto.traceId);

    if (!payment) {
      throw new Error(`Payment with traceId ${messageDto.traceId} not found`);
    }

    // Cambiar estado a IN_PROGRESS
    await this.paymentRepo.updateStatus(messageDto.traceId, "IN_PROGRESS");

    // Simular latencia bancaria
    await sleep(5000);

    // Enviar a check-balance
    await this.queueService.enqueueCheckBalance(messageDto.traceId);

    return { traceId: messageDto.traceId, next: "check-balance" };
  }
}
