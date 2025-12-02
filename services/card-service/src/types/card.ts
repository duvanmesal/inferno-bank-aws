export type CardType = "DEBIT" | "CREDIT"
export type CardStatus = "PENDING" | "ACTIVATED"

export interface Card {
  uuid: string
  user_id: string
  type: CardType
  status: CardStatus
  balance: number
  usedBalance: number
  createdAt: string
  updatedAt: string
}

export interface CardResponse {
  uuid: string
  user_id: string
  type: CardType
  status: CardStatus
  balance: number
  usedBalance: number
  availableBalance?: number
  createdAt: string
}
