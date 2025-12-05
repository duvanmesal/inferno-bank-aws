export class TransactionService {
  constructor(paymentRepo, coreBank) {
    this.paymentRepo = paymentRepo;
    this.coreBank = coreBank;
  }

  async process(dto) {
    const payment = await this.paymentRepo.getPayment(dto.traceId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    const amount = payment.service.precio_mensual;
    const cardId = payment.cardId;

    const result = await this.coreBank.executeTransaction(cardId, amount);

    if (!result.ok) {
      await this.paymentRepo.markAsFailed(dto.traceId, "Transacción rechazada por el banco");
      console.log("❌ Transaction FAILED for traceId", dto.traceId);
      return;
    }

    await this.paymentRepo.markAsFinished(dto.traceId);
    console.log("✔ Transaction SUCCESS", dto.traceId);
  }
}
