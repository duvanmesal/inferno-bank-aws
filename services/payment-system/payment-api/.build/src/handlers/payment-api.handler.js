import { response } from "../utils/response.js";
import { HttpError } from "../errors/HttpError.js";

import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { CoreBankService } from "../services/CoreBankService.js";
import { QueueService } from "../services/QueueService.js";
import { PaymentService } from "../services/PaymentService.js";
import { PaymentDto } from "../dto/PaymentDto.js";

const paymentRepo = new PaymentRepository();
const coreBank = new CoreBankService();
const queueService = new QueueService();

const paymentService = new PaymentService(paymentRepo, coreBank, queueService);

export const handler = async (event) => {
  try {
    const method = event.httpMethod;
    const resource = event.resource; // ej: "/payment" o "/payment/{traceId}"

    // POST /payment
    if (method === "POST" && resource === "/payment") {
      const result = await paymentService.createPaymentFromHttpBody(event.body);
      // result = { traceId }
      return response(201, result);
    }

    // GET /payment/{traceId}
    if (method === "GET" && resource === "/payment/{traceId}") {
      const traceId = event.pathParameters?.traceId;

      if (!traceId) {
        return response(400, { message: "traceId requerido en path" });
      }

      const paymentDomain = await paymentService.getPaymentById(traceId);

      if (!paymentDomain) {
        return response(404, { message: "Pago no encontrado" });
      }

      const dto = PaymentDto.fromDomain(paymentDomain);
      return response(200, dto);
    }

    return response(404, { message: "Route not handled in payment-api" });
  } catch (err) {
    console.error("❌ ERROR in payment-api:", err);

    if (err instanceof HttpError) {
      // Errores que nosotros mismos lanzamos (CoreBank, validaciones, etc.)
      return response(err.status, { message: err.message });
    }

    // 🔥 Aquí es donde antes ocultábamos TODO.
    // Ahora devolvemos también el mensaje de error real para poder depurar.
    const errorMessage =
      err && err.message ? err.message : String(err);

    return response(500, {
      message: "Internal server error",
      error: errorMessage,
    });
  }
};
