import { uuid } from "../utils/uuid.js";
import { CreatePaymentDto } from "../dto/CreatePaymentDto.js";

export class PaymentService {
  constructor(paymentRepo, coreBankService, queueService) {
    this.paymentRepo = paymentRepo;
    this.coreBankService = coreBankService;
    this.queueService = queueService;
  }

  async createPaymentFromHttpBody(body) {
    // 1. Validar + mapear body a DTO
    const dto = CreatePaymentDto.fromHttpRequestBody(body);

    // 2. Obtener info de tarjeta (incluye userId) desde el Core Bank
    const cardInfo = await this.coreBankService.getCard(dto.cardId);

    // 3. Generar traceId
    const traceId = uuid();

    // 4. Crear registro inicial en PAYMENT_TABLE con status INITIAL
    await this.paymentRepo.createInitialPayment({
      traceId,
      userId: cardInfo.userId,
      cardId: dto.cardId,
      service: dto.service,
    });

    // 5. Enviar a cola start-payment
    try {
      await this.queueService.enqueueStart(traceId);
    } catch (err) {
      // 🔥 Si falla el envío a SQS, NO dejamos el pago en INITIAL:
      // lo marcamos FAILED con un error claro y re-lanzamos para que el handler devuelva 500
      await this.paymentRepo.markAsFailed(
        traceId,
        "Failed to enqueue start-payment message",
        [
          `Error en enqueueStart: ${
            err && err.message ? err.message : String(err)
          }`,
        ],
      );
      throw err;
    }

    // 6. Respuesta al cliente
    return { traceId };
  }

  async getPaymentById(traceId) {
    const payment = await this.paymentRepo.getPayment(traceId);
    return payment;
  }
}
