import { HttpError } from "../errors/HttpError.js";

export class CoreBankService {
  async getCard(cardId) {
    const baseUrl = process.env.CORE_BANK_BASE_URL;

    if (!baseUrl) {
      throw new HttpError(
        500,
        "CORE_BANK_BASE_URL is not configured in environment",
      );
    }

    const url = `${baseUrl}/cards/${cardId}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new HttpError(400, "Card not found in CoreBank");
    }

    const data = await res.json();

    if (!data.userId) {
      throw new HttpError(500, "Core bank response missing userId");
    }

    return data;
  }
}
