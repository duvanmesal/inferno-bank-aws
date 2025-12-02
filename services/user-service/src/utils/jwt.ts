import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from "jose"

export interface JWTPayload extends JoseJWTPayload {
  sub: string
  email: string
  document: string
}

export const generateToken = async (
  payload: Omit<JWTPayload, "iat" | "exp">,
  secret: string
): Promise<string> => {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(secret)

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretKey)
}

export const verifyToken = async (token: string, secret: string): Promise<JWTPayload> => {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(secret)

  const { payload } = await jwtVerify(token, secretKey)

  // Aquí le decimos a TS que el payload incluye los campos extendidos
  return payload as JWTPayload
}

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return null

  return parts[1]
}
