// services/card-service/src/types/transaction.ts

export type TransactionType = "PURCHASE" | "SAVING" | "PAYMENT_BALANCE"

export type TransactionSource = "CARD_PURCHASE" | "SERVICE_PAYMENT" | "INTERNAL"

export interface Transaction {
  uuid: string
  cardId: string
  amount: number
  merchant: string
  type: TransactionType
  createdAt: string

  // Metadatos extra para hacer el historial más útil
  userId?: string
  cardType?: "DEBIT" | "CREDIT"
  cardLast4?: string

  // De dónde vino la operación (compra directa, pago de servicio, etc.)
  source?: TransactionSource

  // Para enlazar con el flujo de payment-system
  paymentTraceId?: string | null
}

// Compra normal con tarjeta
export interface PurchaseRequest {
  merchant: string
  cardId: string
  amount: number

  // Opcionales: se usarán sobre todo desde payment-system
  source?: TransactionSource
  paymentTraceId?: string
}

export interface SavingRequest {
  merchant: string
  amount: number
}

export interface PaymentRequest {
  merchant: string
  amount: number
}

export interface ReportRequest {
  start: string
  end: string
}
