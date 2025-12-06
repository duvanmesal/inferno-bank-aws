import bcrypt from "bcryptjs"

const SALT_ROUNDS = 10

export const hashPin = async (pin: string): Promise<string> => {
  return bcrypt.hash(pin, SALT_ROUNDS)
}

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(pin, hash)
}
