export type CardType = "DEBIT" | "CREDIT"
export type CardStatus = "PENDING" | "ACTIVATED" | "BLOCKED"

// Marca de la tarjeta
export type CardBrand = "VISA" | "MASTERCARD" | "AMEX" | "UNKNOWN"

export interface Card {
  uuid: string
  user_id: string
  type: CardType
  status: CardStatus
  balance: number
  usedBalance: number
  createdAt: string
  updatedAt: string

  // 🔽 NUEVOS CAMPOS BANCARIOS (persistidos en Dynamo)
  cardNumber?: string   // 16 dígitos
  expiration?: string   // MM/YY
  cvv?: string          // solo uso interno
  brand?: CardBrand
  last4?: string        // últimos 4 dígitos
}

export interface CardResponse {
  cardId: string
  userId: string
  type: CardType
  status: CardStatus
  balance: number
  usedBalance: number
  availableBalance: number
  createdAt: string

  cardNumber?: string
  expiration?: string
  brand?: CardBrand
  last4?: string
  // cvv?: string  -> solo lo añadimos cuando el token temporal es válido
}
