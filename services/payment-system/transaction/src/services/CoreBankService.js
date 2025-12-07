// services/payment-system/transaction/src/services/CoreBankService.js

const fetch = require("node-fetch")
const env = require("../config/env")

class CoreBankService {
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
    const { merchant = "InfernoBank Payment System", source, paymentTraceId, logs } = metadata

    const addLog = (msg, extra) => {
      const line =
        extra !== undefined
          ? `${msg} | ${JSON.stringify(extra)}`
          : msg

      if (Array.isArray(logs)) {
        logs.push(`[CoreBankService] ${line}`)
      }

      console.log("[CoreBankService]", line)
    }

    if (!cardId) {
      const msg = "cardId is required to execute transaction"
      addLog("Validation error", { msg })
      throw new Error(msg)
    }

    if (typeof amount !== "number" || amount <= 0) {
      const msg = "amount must be a positive number"
      addLog("Validation error", { msg, amount })
      throw new Error(msg)
    }

    const url = `${env.CORE_BANK_BASE_URL}/transactions/purchase`

    const body = {
      cardId,
      amount,
      merchant,
    }

    if (source) {
      body.source = source
    }

    if (paymentTraceId) {
      body.paymentTraceId = paymentTraceId
    }

    addLog("Calling CoreBank /transactions/purchase", {
      url,
      body,
    })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const rawText = await response.text().catch(() => "")
    let data = null

    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      // ignore parse error, keep rawText in logs
    }

    if (!response.ok) {
      const errorInfo = {
        status: response.status,
        statusText: response.statusText,
        body: rawText,
        parsed: data,
      }

      addLog("CoreBank responded with error", errorInfo)

      const message = `CoreBank transaction failed with status ${response.status}`
      const err = new Error(message)
      // opcional: adjuntar info para el catch de arriba
      err.coreBankResponse = errorInfo
      throw err
    }

    addLog("CoreBank transaction success", { data })

    return data || { message: "Purchase processed" }
  }
}

module.exports = CoreBankService
