import { ValidationError } from "../errors/ValidationError.js";

export class CreatePaymentDto {
  constructor({ cardId, service }) {
    this.cardId = cardId;
    this.service = service;
  }

  static fromHttpRequestBody(body) {
    if (!body) {
      throw new ValidationError("Body requerido");
    }

    let parsed;
    if (typeof body === "string") {
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        throw new ValidationError("Body debe ser JSON válido");
      }
    } else if (typeof body === "object") {
      parsed = body;
    } else {
      throw new ValidationError("Formato de body no soportado");
    }

    const { cardId, service } = parsed;

    if (!cardId || typeof cardId !== "string") {
      throw new ValidationError("cardId es requerido y debe ser string");
    }

    if (!service || typeof service !== "object") {
      throw new ValidationError("service es requerido y debe ser un objeto");
    }

    // Podrías validar campos internos del service aquí (id, categoria, etc.)

    return new CreatePaymentDto({ cardId, service });
  }
}
