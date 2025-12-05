import { sleep } from "../utils/sleep.js";

export class CheckBalanceService {
  constructor(paymentRepo, coreBank, queueService) {
    this.paymentRepo = paymentRepo;
    this.coreBank = coreBank;
    this.queueService = queueService;
  }

  async process(dto) {
    const payment = await this.paymentRepo.getPayment(dto.traceId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    const amount = payment.service.precio_mensual;
    const userId = payment.userId;

    // Llamar core bank
    const result = await this.coreBank.validateBalance(userId, amount);

    if (!result.ok) {
      await this.paymentRepo.updateFailed(dto.traceId, "Saldo insuficiente");
      console.log("❌ Saldo insuficiente, deteniendo flujo");
      return;
    }

    // Si hay saldo → avanzar
    await this.paymentRepo.updateInProgress(dto.traceId);

    await sleep(5000);

    await this.queueService.enqueueTransaction(dto.traceId);

    console.log("✔ Balance OK. Enviado a transaction.");
  }
}
