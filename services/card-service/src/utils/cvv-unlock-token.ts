import jwt from "jsonwebtoken"

interface CvvUnlockPayload {
  sub: string        // userId
  scope: "cvv:view"
  iat: number
  exp: number
}

// Devuelve el userId que tiene el CVV desbloqueado, o null si no es válido
export const verifyCvvUnlockToken = (token?: string | null): string | null => {
  if (!token) return null

  const secret = process.env.CVV_UNLOCK_JWT_SECRET
  if (!secret) {
    console.warn("[cvv-unlock] CVV_UNLOCK_JWT_SECRET not set")
    return null
  }

  try {
    const decoded = jwt.verify(token, secret) as CvvUnlockPayload
    if (decoded.scope !== "cvv:view") return null
    return decoded.sub
  } catch (e) {
    console.warn("[cvv-unlock] invalid token:", e)
    return null
  }
}
