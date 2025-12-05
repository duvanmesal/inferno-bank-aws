export class PaymentDto {
  constructor({ traceId, userId, cardId, status, service, error, createdAt, updatedAt }) {
    this.traceId = traceId;
    this.userId = userId;
    this.cardId = cardId;
    this.status = status;
    this.service = service;
    this.error = error || null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromDomain(paymentDomain) {
    if (!paymentDomain) return null;

    return new PaymentDto({
      traceId: paymentDomain.traceId,
      userId: paymentDomain.userId,
      cardId: paymentDomain.cardId,
      status: paymentDomain.status,
      service: paymentDomain.service,
      error: paymentDomain.error,
      createdAt: paymentDomain.createdAt,
      updatedAt: paymentDomain.updatedAt
    });
  }
}
