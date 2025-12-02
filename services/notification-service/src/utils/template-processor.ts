export const processTemplate = (template: string, data: Record<string, any>): string => {
  let processed = template

  // Replace all {{variable}} with actual values
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g")
    processed = processed.replace(regex, String(data[key]))
  })

  // Remove any remaining unprocessed variables
  processed = processed.replace(/{{[^}]+}}/g, "")

  return processed
}

export const getTemplateSubject = (type: string): string => {
  const subjects: Record<string, string> = {
    WELCOME: "Welcome to Inferno Bank!",
    "USER.LOGIN": "New Login Detected",
    "USER.UPDATE": "Profile Updated Successfully",
    "CARD.CREATE": "Your New Card is Ready",
    "CARD.ACTIVATE": "Card Activated Successfully",
    "TRANSACTION.PURCHASE": "Purchase Confirmation",
    "TRANSACTION.SAVE": "Savings Confirmation",
    "TRANSACTION.PAID": "Payment Confirmation",
    "REPORT.ACTIVITY": "Your Transaction Report is Ready",
  }

  return subjects[type] || "Notification from Inferno Bank"
}
