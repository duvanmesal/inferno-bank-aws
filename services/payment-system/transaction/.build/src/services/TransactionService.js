// services/payment-system/transaction/src/services/TransactionService.js

import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { CoreBankService } from "./CoreBankService.js";

export class TransactionService {
  constructor(
    paymentRepo = new PaymentRepository(),
    coreBank = new CoreBankService(),
  ) {
    this.paymentRepo = paymentRepo;
    this.coreBank = coreBank;
  }

  /**
   * Procesa un pago a partir de su traceId:
   * - Carga el registro de PAYMENT
   * - Marca el pago como IN_PROGRESS
   * - Ejecuta la transacción en el CoreBank (card-service)
   * - Actualiza el estado del PAYMENT según éxito o error
   *
   * Todos los pasos importantes se registran en logs[]
   * y si algo falla, esos logs quedan en payment.error.logs
   */
  async process(traceId) {
    const logs = [];
    const addLog = (msg, extra) => {
      const line =
        extra !== undefined ? `${msg} | ${JSON.stringify(extra)}` : msg;
      logs.push(line);
      console.log("[TransactionService]", line);
    };

    addLog("Processing payment", { traceId });

    let payment;

    try {
      payment = await this.paymentRepo.getByTraceId(traceId);

      if (!payment) {
        addLog("Payment not found", { traceId });
        await this.paymentRepo.markAsFailed(
          traceId,
          "Payment not found",
          logs,
        );
        return;
      }

      addLog("Loaded payment", {
        status: payment.status,
        userId: payment.userId,
        cardId: payment.cardId,
      });

      const { cardId, service } = payment;

      if (!cardId) {
        addLog("Payment has no cardId", { traceId });
        await this.paymentRepo.markAsFailed(
          traceId,
          "Card not associated to payment",
          logs,
        );
        return;
      }

      if (!service || typeof service.precio_mensual !== "number") {
        addLog("Payment has invalid service data", {
          traceId,
          service,
        });
        await this.paymentRepo.markAsFailed(
          traceId,
          "Invalid service data for payment",
          logs,
        );
        return;
      }

      const amount = service.precio_mensual;
      const merchant = this.buildMerchantFromService(service);

      addLog("Computed payment details", {
        amount,
        merchant,
      });

      // Marcamos como IN_PROGRESS antes de llamar al CoreBank
      await this.paymentRepo.markAsInProgress(traceId, logs);
      addLog("Marked payment as IN_PROGRESS");

      // Ejecutamos la transacción en el CoreBank (card-service)
      addLog("Calling CoreBank.executeTransaction", {
        cardId,
        amount,
        merchant,
      });

      await this.coreBank.executeTransaction(cardId, amount, {
        merchant,
        source: "SERVICE_PAYMENT",
        paymentTraceId: traceId,
        logs,
      });

      addLog("CoreBank transaction executed successfully");

      // Marcamos como FINISH sin error, pero puedes conservar logs si quieres
      await this.paymentRepo.markAsFinished(traceId, logs);
      addLog("Marked payment as FINISH");
    } catch (error) {
      const errorMessage =
        error && error.message
          ? error.message
          : "Transaction rejected by CoreBank";

      addLog("Error in TransactionService.process", {
        traceId,
        errorMessage,
        stack: error && error.stack ? error.stack : null,
      });

      await this.paymentRepo.markAsFailed(traceId, errorMessage, logs);
    }
  }

  /**
   * Construye un nombre "bonito" para el merchant a partir del servicio.
   * Ejemplos:
   * - "Netflix - BÁSICO"
   * - "Empresa Eléctrica Nacional - Luz Residencial"
   */
  buildMerchantFromService(service) {
    if (!service) return "InfernoBank Payment System";

    const proveedor = service.proveedor || service.categoria || "Servicio";
    const detalle = service.plan || service.servicio || "";

    if (detalle) {
      return `${proveedor} - ${detalle}`;
    }

    return String(proveedor);
  }
}
