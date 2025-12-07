// services/payment-system/check-balance/src/handlers/check-balance.js

const { SQSEvent } = require("aws-lambda") // solo para tipos, si quieres
const PaymentRepository = require("../repositories/PaymentRepository")
const fetch = require("node-fetch")

const paymentRepo = new PaymentRepository()

const CORE_BANK_BASE_URL = process.env.CORE_BANK_BASE_URL
const TRANSACTION_QUEUE_URL = process.env.TRANSACTION_QUEUE_URL

// Si tienes ya un util para SQS, úsalo; si no, algo simple:
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs")
const sqs = new SQSClient({})

async function sendToTransactionQueue(traceId) {
  const body = JSON.stringify({ traceId })

  await sqs.send(
    new SendMessageCommand({
      QueueUrl: TRANSACTION_QUEUE_URL,
      MessageBody: body,
    }),
  )
}

/**
 * Lambda handler para el servicio de check-balance.
 * Dispara cuando llega un mensaje con { traceId } desde la cola "check-balance".
 */
exports.handler = async (event) => {
  for (const record of event.Records) {
    const logs = []
    const addLog = (msg, extra) => {
      const line =
        extra !== undefined
          ? `${msg} | ${JSON.stringify(extra)}`
          : msg
      logs.push(`[CheckBalance] ${line}`)
      console.log("[CheckBalance]", line)
    }

    try {
      const messageBody = JSON.parse(record.body)
      const traceId = messageBody.traceId

      addLog("Received message from SQS", { traceId, rawBody: record.body })

      if (!traceId) {
        addLog("Missing traceId in message")
        // No podemos guardar nada porque no tenemos key, solo logeamos en CloudWatch
        continue
      }

      const payment = await paymentRepo.getByTraceId(traceId)

      if (!payment) {
        addLog("Payment not found for traceId", { traceId })
        await paymentRepo.markAsFailed(traceId, "Payment not found in check-balance", logs)
        continue
      }

      addLog("Loaded payment", {
        status: payment.status,
        userId: payment.userId,
        cardId: payment.cardId,
      })

      const { cardId, service } = payment

      if (!cardId) {
        addLog("Payment has no cardId", { traceId })
        await paymentRepo.markAsFailed(traceId, "Card not associated to payment", logs)
        continue
      }

      if (!service || typeof service.precio_mensual !== "number") {
        addLog("Invalid service data in payment", { traceId, service })
        await paymentRepo.markAsFailed(traceId, "Invalid service data for payment", logs)
        continue
      }

      const amount = service.precio_mensual
      addLog("Checking balance for card", { cardId, amount })

      if (!CORE_BANK_BASE_URL) {
        addLog("CORE_BANK_BASE_URL is not set")
        await paymentRepo.markAsFailed(
          traceId,
          "CORE_BANK_BASE_URL is not configured",
          logs,
        )
        continue
      }

      const cardUrl = `${CORE_BANK_BASE_URL}/cards/${cardId}`

      addLog("Calling CoreBank to get card data", { url: cardUrl })

      const response = await fetch(cardUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const rawText = await response.text().catch(() => "")
      let cardData = null

      try {
        cardData = rawText ? JSON.parse(rawText) : null
      } catch (e) {
        addLog("Failed to parse card data JSON", { error: e.message, rawText })
      }

      if (!response.ok) {
        addLog("CoreBank responded with error when checking balance", {
          status: response.status,
          statusText: response.statusText,
          body: rawText,
          parsed: cardData,
        })

        await paymentRepo.markAsFailed(
          traceId,
          `CoreBank get card failed with status ${response.status}`,
          logs,
        )
        continue
      }

      addLog("CoreBank card data received", cardData)

      // Aquí dependo de cómo devuelves la tarjeta en /cards/{cardId}
      // Ajusta estos nombres a lo que tengas realmente.
      const card = cardData.card || cardData

      if (!card) {
        addLog("Card data missing in CoreBank response")
        await paymentRepo.markAsFailed(
          traceId,
          "Card data missing in CoreBank response",
          logs,
        )
        continue
      }

      let availableBalance = 0

      if (card.type === "DEBIT") {
        availableBalance = card.balance
      } else if (card.type === "CREDIT") {
        const limit = card.balance
        const used = card.usedBalance || 0
        availableBalance = limit - used
      } else {
        addLog("Unsupported card type when checking balance", { type: card.type })
        await paymentRepo.markAsFailed(
          traceId,
          `Unsupported card type: ${card.type}`,
          logs,
        )
        continue
      }

      addLog("Computed available balance", { availableBalance })

      if (availableBalance < amount) {
        addLog("Insufficient balance for payment", { availableBalance, amount })
        await paymentRepo.markAsFailed(
          traceId,
          "Insufficient balance",
          logs,
        )
        continue
      }

      // Si hay saldo suficiente, marcamos IN_PROGRESS (con logs)
      addLog("Sufficient balance, marking as IN_PROGRESS and sending to transaction queue")

      await paymentRepo.markAsInProgress(traceId, logs)

      // Enviamos al siguiente paso del flujo (transaction worker)
      await sendToTransactionQueue(traceId)

      addLog("Sent message to transaction queue", {
        queueUrl: TRANSACTION_QUEUE_URL,
        traceId,
      })

      // Aquí no cambiamos status a FINISH; eso lo hará transaction-service
    } catch (err) {
      console.error("[CheckBalance] Unhandled error:", err)

      // Si podemos extraer un traceId del mensaje, intentamos marcarlo como FAILED
      try {
        const body = JSON.parse(record.body)
        const traceId = body.traceId
        if (traceId) {
          const logs = [
            `[CheckBalance] Unhandled error ${err && err.message}`,
          ]
          await paymentRepo.markAsFailed(
            traceId,
            err && err.message ? err.message : "Unhandled error in check-balance",
            logs,
          )
        }
      } catch {
        // Si ni siquiera podemos parsear el body, solo log en CloudWatch
      }
    }
  }
}
