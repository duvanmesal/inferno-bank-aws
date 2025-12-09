import { sleep } from "../utils/sleep.js";

export class StartPaymentService {
  constructor(paymentRepo, queueService) {
    this.paymentRepo = paymentRepo;
    this.queueService = queueService;
  }

  async process(messageDto) {
    const { traceId } = messageDto;
    const logs = [];
    const addLog = (msg, extra) => {
      const line =
        extra !== undefined ? `${msg} | ${JSON.stringify(extra)}` : msg;
      logs.push(line);
      console.log("[StartPaymentService]", line);
    };

    addLog("Processing start-payment message", { traceId });

    const payment = await this.paymentRepo.getPayment(traceId);

    if (!payment) {
      addLog("Payment not found in StartPaymentService", { traceId });
      await this.paymentRepo.markAsFailed(
        traceId,
        "Payment not found in start-payment",
        logs,
      );
      return { traceId, next: "STOPPED_NOT_FOUND" };
    }

    addLog("Payment loaded", {
      status: payment.status,
      userId: payment.userId,
      cardId: payment.cardId,
    });

    // Cambiar estado a IN_PROGRESS
    await this.paymentRepo.updateStatus(traceId, "IN_PROGRESS", logs);
    addLog("Payment marked as IN_PROGRESS");

    // Simular latencia bancaria
    await sleep(5000);

    // Enviar a check-balance
    await this.queueService.enqueueCheckBalance(traceId);
    addLog("Enqueued to check-balance");

    return { traceId, next: "check-balance" };
  }
}
