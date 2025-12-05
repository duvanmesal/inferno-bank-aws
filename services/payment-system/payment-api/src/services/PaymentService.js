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

    // 2. Obtener info de tarjeta (incluye userId)
    const cardInfo = await this.coreBankService.getCard(dto.cardId);

    const traceId = uuid();

    // 3. Registrar estado inicial en DynamoDB
    await this.paymentRepo.createInitialPayment({
      traceId,
      userId: cardInfo.userId,
      cardId: dto.cardId,
      service: dto.service
    });

    // 4. Enviar a cola start-payment
    await this.queueService.enqueueStart(traceId);

    // 5. Resultado para el handler
    return { traceId };
  }

  async getPaymentById(traceId) {
    const payment = await this.paymentRepo.getPayment(traceId);
    return payment;
  }
}
