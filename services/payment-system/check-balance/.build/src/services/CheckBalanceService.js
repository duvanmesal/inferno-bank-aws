import { sleep } from "../utils/sleep.js";

export class CheckBalanceService {
  constructor(paymentRepo, coreBank, queueService) {
    this.paymentRepo = paymentRepo;
    this.coreBank = coreBank;
    this.queueService = queueService;
  }

  async process(dto) {
    console.log("[CheckBalanceService] Procesando traceId:", dto.traceId);

    const payment = await this.paymentRepo.getPayment(dto.traceId);

    if (!payment) {
      console.error("[CheckBalanceService] Payment not found");
      throw new Error("Payment not found");
    }

    const amount = payment.service.precio_mensual;
    const cardId = payment.cardId;

    console.log(
      "[CheckBalanceService] Validando saldo para cardId:",
      cardId,
      "amount:",
      amount
    );

    // Llamar Core Bank usando la tarjeta
    const result = await this.coreBank.validateBalance(cardId, amount);

    if (!result.ok) {
      console.log("[CheckBalanceService] ❌ Saldo insuficiente");
      await this.paymentRepo.updateFailed(dto.traceId, "Saldo insuficiente");
      return;
    }

    console.log("[CheckBalanceService] ✔ Saldo OK, avanzando a transaction");

    // (Opcional) dejamos IN_PROGRESS como está, sólo seguimos el flujo
    await this.paymentRepo.updateInProgress(dto.traceId);

    // Simular latencia
    await sleep(5000);

    // Enviar a la cola de transaction
    await this.queueService.enqueueTransaction(dto.traceId);
  }
}
