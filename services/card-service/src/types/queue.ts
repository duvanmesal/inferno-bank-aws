export interface CardRequestMessage {
  userId: string
  request: "DEBIT" | "CREDIT"
}

export interface CardErrorRecord {
  uuid: string
  userId: string
  request: string
  error: string
  messageBody: string
  createdAt: string
}
