import type { CardBrand } from "../types/card"

const BIN = "421587" // BIN fijo de Inferno Bank

const randomDigits = (length: number): string => {
  let result = ""
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

// Algoritmo de Luhn para dígito verificador
const luhnCheckDigit = (numberWithoutCheck: string): string => {
  let sum = 0
  const reversed = numberWithoutCheck.split("").reverse()

  for (let i = 0; i < reversed.length; i++) {
    let n = parseInt(reversed[i], 10)
    if (i % 2 === 0) {
      n = n * 2
      if (n > 9) n -= 9
    }
    sum += n
  }

  const mod = sum % 10
  return mod === 0 ? "0" : (10 - mod).toString()
}

export interface GeneratedCardData {
  cardNumber: string
  expiration: string
  cvv: string
  brand: CardBrand
  last4: string
}

export const generateCardData = (): GeneratedCardData => {
  // BIN (6) + cuerpo (9) = 15 → +1 dígito Luhn = 16
  const body = randomDigits(9)
  const partial = BIN + body
  const checkDigit = luhnCheckDigit(partial)
  const cardNumber = partial + checkDigit

  // Expiración: +4 años
  const now = new Date()
  const year = now.getFullYear() + 4
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const expiration = `${month}/${year.toString().slice(-2)}`

  const cvv = randomDigits(3)
  const brand: CardBrand = "VISA"
  const last4 = cardNumber.slice(-4)

  return {
    cardNumber,
    expiration,
    cvv,
    brand,
    last4,
  }
}
