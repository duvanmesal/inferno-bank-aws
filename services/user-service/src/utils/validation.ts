export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 8
}

export const validateDocument = (document: string): boolean => {
  return document.length >= 5 && /^\d+$/.test(document)
}

export const validateImageType = (fileType: string): boolean => {
  const validTypes = ["image/jpeg", "image/jpg", "image/png"]
  return validTypes.includes(fileType.toLowerCase())
}

export const validateBase64 = (str: string): boolean => {
  try {
    return Buffer.from(str, "base64").toString("base64") === str
  } catch {
    return false
  }
}
