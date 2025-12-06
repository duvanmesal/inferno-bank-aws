export class TransactionService {
  constructor(paymentRepo, coreBank) {
    this.paymentRepo = paymentRepo;
    this.coreBank = coreBank;
  }

  async process(dto) {
    console.log("[TransactionService] Procesando traceId:", dto.traceId);

    const payment = await this.paymentRepo.getPayment(dto.traceId);

    if (!payment) {
      console.error("[TransactionService] Payment not found");
      throw new Error("Payment not found");
    }

    const amount = payment.service.precio_mensual;
    const cardId = payment.cardId;

    console.log(
      "[TransactionService] Ejecutando compra para cardId:",
      cardId,
      "amount:",
      amount
    );

    const result = await this.coreBank.executeTransaction(cardId, amount);

    if (!result.ok) {
      console.log(
        "[TransactionService] ❌ Transaction FAILED for traceId",
        dto.traceId
      );
      await this.paymentRepo.markAsFailed(
        dto.traceId,
        "Transacción rechazada por el banco"
      );
      return;
    }

    await this.paymentRepo.markAsFinished(dto.traceId);
    console.log("[TransactionService] ✔ Transaction SUCCESS", dto.traceId);
  }
}
