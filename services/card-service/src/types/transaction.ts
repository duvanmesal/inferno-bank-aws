export type TransactionType = "PURCHASE" | "SAVING" | "PAYMENT_BALANCE"

export interface Transaction {
  uuid: string
  cardId: string
  amount: number
  merchant: string
  type: TransactionType
  createdAt: string
}

export interface PurchaseRequest {
  merchant: string
  cardId: string
  amount: number
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
