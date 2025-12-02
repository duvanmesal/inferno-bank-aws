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

export type NotificationStatus = "SENT" | "ERROR"

export interface NotificationMessage {
  userId: string
  email: string
  type: NotificationType
  data: Record<string, any>
}

export interface NotificationRecord {
  uuid: string
  type: NotificationType
  payload: string
  status: NotificationStatus
  createdAt: string
  error?: string
}

export interface NotificationErrorRecord {
  uuid: string
  type: NotificationType
  payload: string
  error: string
  messageBody: string
  createdAt: string
}
