import jwt from "jsonwebtoken"

interface CvvUnlockPayload {
  sub: string        // userId
  scope: "cvv:view"
}

export const createCvvUnlockToken = (userId: string, ttlSeconds = 60): string => {
  const secret = process.env.CVV_UNLOCK_JWT_SECRET
  if (!secret) {
    throw new Error("CVV_UNLOCK_JWT_SECRET not set")
  }

  const payload: CvvUnlockPayload = {
    sub: userId,
    scope: "cvv:view",
  }

  return jwt.sign(payload, secret, { expiresIn: ttlSeconds })
}
