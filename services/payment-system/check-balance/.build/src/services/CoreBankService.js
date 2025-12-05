import { env } from "../config/env.js";

export class CoreBankService {
  async validateBalance(userId, amount) {
    const url = `${env.CORE_BANK_BASE_URL}/balance/validate?userId=${userId}&amount=${amount}`;

    const res = await fetch(url);

    if (!res.ok) {
      return { ok: false }; // No hay saldo
    }

    const data = await res.json();

    return {
      ok: data.valid === true
    };
  }
}
