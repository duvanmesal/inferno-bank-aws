export type NotificationType =
  | "WELCOME"
  | "USER.LOGIN"
  | "USER.UPDATE"
  | "CARD.CREATE"
  | "CARD.ACTIVATE"
  | "TRANSACTION.PURCHASE"
  | "TRANSACTION.SAVE"
  | "TRANSACTION.PAID"
  | "REPORT.ACTIVITY"

export interface NotificationMessage {
  userId: string
  email: string
  type: NotificationType
  data: Record<string, any>
}
