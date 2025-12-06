import { env } from "../config/env.js";

export class CoreBankService {
  /**
   * Ejecuta la compra en el core bancario.
   * Usa POST /transactions/purchase del card-service.
   * Cualquier 2xx lo consideramos éxito.
   */
  async executeTransaction(cardId, amount) {
    const url = `${env.CORE_BANK_BASE_URL}/transactions/purchase`;

    console.log("[CoreBankService.executeTransaction] POST", url, {
      cardId,
      amount,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: "InfernoBank Payment System",
        cardId,
        amount,
      }),
    });

    if (!res.ok) {
      console.error(
        "[CoreBankService.executeTransaction] Core respondió status:",
        res.status
      );
      return { ok: false };
    }

    // Si quieres inspeccionar algo del body:
    try {
      const data = await res.json();
      console.log(
        "[CoreBankService.executeTransaction] Respuesta core:",
        JSON.stringify(data)
      );
    } catch {
      console.log(
        "[CoreBankService.executeTransaction] Sin JSON en respuesta, pero status OK"
      );
    }

    return { ok: true };
  }
}
