import { ValidationError } from "../errors/ValidationError.js";

export class StartPaymentMessageDto {
  constructor({ traceId }) {
    this.traceId = traceId;
  }

  static fromSqsRecord(record) {
    if (!record || !record.body) {
      throw new ValidationError("Mensaje vacío o inválido");
    }

    let body;
    try {
      body = JSON.parse(record.body);
    } catch (e) {
      throw new ValidationError("El mensaje SQS no es JSON válido");
    }

    const { traceId } = body;

    if (!traceId || typeof traceId !== "string") {
      throw new ValidationError("traceId requerido en mensaje SQS");
    }

    return new StartPaymentMessageDto({ traceId });
  }
}
