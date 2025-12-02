export type CardType = "DEBIT" | "CREDIT"

export interface CreateCardRequest {
  userId: string
  request: CardType
}
