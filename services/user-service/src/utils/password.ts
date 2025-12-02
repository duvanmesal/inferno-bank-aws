import * as bcrypt from "bcryptjs"

export const hashPassword = async (password: string, rounds = 10): Promise<string> => {
  return await bcrypt.hash(password, rounds)
}

export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword)
}
