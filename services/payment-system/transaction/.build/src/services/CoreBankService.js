// services/payment-system/transaction/src/services/CoreBankService.js

import { env } from "../config/env.js";

export class CoreBankService {
  /**
   * Ejecuta una transacción de compra en el CoreBank (card-service).
   *
   * @param {string} cardId
   * @param {number} amount
   * @param {object} metadata
   *   - merchant?: string
   *   - source?: "SERVICE_PAYMENT" | "CARD_PURCHASE" | "INTERNAL"
   *   - paymentTraceId?: string
   *   - logs?: string[]   // opcional, solo para debug
   */
  async executeTransaction(cardId, amount, metadata = {}) {
    const logs = Array.isArray(metadata.logs) ? metadata.logs : [];
    const addLog = (msg, extra) => {
      const line =
        extra !== undefined ? `${msg} | ${JSON.stringify(extra)}` : msg;
      logs.push(line);
      console.log("[CoreBankService]", line);
    };

    if (!env.CORE_BANK_BASE_URL) {
      addLog("CORE_BANK_BASE_URL is not set");
      throw new Error("CORE_BANK_BASE_URL is not configured");
    }

    const url = `${env.CORE_BANK_BASE_URL}/transactions/purchase`;

    const body = {
      cardId,
      amount,
      metadata: {
        merchant: metadata.merchant,
        source: metadata.source || "SERVICE_PAYMENT",
        paymentTraceId: metadata.paymentTraceId,
      },
    };

    addLog("Calling CoreBank purchase endpoint", { url, body });

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      addLog("Network error calling CoreBank", {
        message: err && err.message ? err.message : String(err),
      });
      throw err;
    }

    let data = null;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      // Si la respuesta no es JSON, la dejamos como null
    }

    if (!response.ok) {
      const errorInfo = {
        status: response.status,
        body: data,
      };
      addLog("CoreBank transaction failed", errorInfo);

      const message = `CoreBank transaction failed with status ${response.status}`;
      const err = new Error(message);
      err.coreBankResponse = errorInfo;
      throw err;
    }

    addLog("CoreBank transaction success", { data });

    return data || { message: "Purchase processed" };
  }
}
