import { env } from "../config/env.js";

export class CoreBankService {
  /**
   * Valida si la tarjeta tiene saldo suficiente para el monto.
   * Usa el endpoint real del Core Bank: GET /cards/{cardId}
   */
  async validateBalance(cardId, amount) {
    const url = `${env.CORE_BANK_BASE_URL}/cards/${cardId}`;

    console.log("[CoreBankService.validateBalance] GET", url, "amount:", amount);

    const res = await fetch(url);

    if (!res.ok) {
      console.error("[CoreBankService.validateBalance] Core respondió", res.status);
      // Tarjeta no encontrada o error en el core
      return { ok: false };
    }

    const data = await res.json();

    // Del getter de cards tenemos:
    // {
    //   cardId, userId, type, status,
    //   balance, usedBalance, availableBalance, createdAt
    // }
    const available =
      data.availableBalance ??
      (typeof data.balance === "number" && typeof data.usedBalance === "number"
        ? data.balance - data.usedBalance
        : 0);

    console.log(
      "[CoreBankService.validateBalance] available:",
      available,
      "needed:",
      amount
    );

    return {
      ok: available >= amount,
    };
  }
}
