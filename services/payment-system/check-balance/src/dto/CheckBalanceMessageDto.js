import { ValidationError } from "../errors/ValidationError.js";

export class CheckBalanceMessageDto {
  constructor({ traceId }) {
    this.traceId = traceId;
  }

  static fromSqsRecord(record) {
    if (!record || !record.body) {
      throw new ValidationError("Mensaje SQS vacío");
    }

    let body;
    try {
      body = JSON.parse(record.body);
    } catch (e) {
      throw new ValidationError("Mensaje SQS no es JSON válido");
    }

    const { traceId } = body;

    if (!traceId) {
      throw new ValidationError("traceId requerido");
    }

    return new CheckBalanceMessageDto({ traceId });
  }
}
