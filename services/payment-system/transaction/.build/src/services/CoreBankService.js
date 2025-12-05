import { env } from "../config/env.js";

export class CoreBankService {
  async executeTransaction(cardId, amount) {
    const res = await fetch(`${env.CORE_BANK_BASE_URL}/transactions/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: "Tienda patito feliz",
        cardId,
        amount
      })
    });

    if (!res.ok) {
      return { ok: false };
    }

    const data = await res.json();
    return {
      ok: data.success === true
    };
  }
}
