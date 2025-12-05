import { ValidationError } from "../errors/ValidationError.js";

export class TransactionMessageDto {
  constructor({ traceId }) {
    this.traceId = traceId;
  }

  static fromSqsRecord(record) {
    if (!record?.body) {
      throw new ValidationError("Mensaje SQS vacío");
    }

    let body;
    try {
      body = JSON.parse(record.body);
    } catch {
      throw new ValidationError("Mensaje SQS inválido");
    }

    if (!body.traceId) {
      throw new ValidationError("traceId requerido");
    }

    return new TransactionMessageDto(body);
  }
}
