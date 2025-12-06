import type { SQSEvent, SQSRecord } from "aws-lambda"
import { v4 as uuidv4 } from "uuid"
import { docClient, PutCommand, QueryCommand } from "../utils/dynamodb"
import { getS3Object } from "../utils/s3"
import { sendEmail } from "../utils/ses"
import { processTemplate, getTemplateSubject } from "../utils/template-processor"
import type { NotificationMessage, NotificationRecord } from "../types/notification"
import type { User } from "../types/user"

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      await processNotification(record)
    } catch (error) {
      console.error(" Error processing notification:", error)
      // SQS will retry and eventually send to DLQ
      throw error
    }
  }
}

async function processNotification(record: SQSRecord): Promise<void> {
  const message: NotificationMessage = JSON.parse(record.body)
  const { userId, email: providedEmail, type, data } = message

  console.log(` Processing notification: ${type} for user: ${userId}`)

  // Get user email if not provided
  let userEmail = providedEmail
  let userName = data.fullName || "User"

  if (!userEmail || userEmail === "") {
    const userTableName = process.env.USER_TABLE_NAME!

    const userResult = await docClient.send(
      new QueryCommand({
        TableName: userTableName,
        KeyConditionExpression: "#uuid = :uuid",
        ExpressionAttributeNames: {
          "#uuid": "uuid",
        },
        ExpressionAttributeValues: {
          ":uuid": userId,
        },
      }),
    )

    if (!userResult.Items || userResult.Items.length === 0) {
      throw new Error(`User not found: ${userId}`)
    }

    const user = userResult.Items[0] as User
    userEmail = user.email
    userName = `${user.name} ${user.lastName}`
  }

  // Get email template from S3
  const templateBucket = process.env.TEMPLATES_BUCKET!
  const templateKey = `${type}.html`

  let template: string
  try {
    template = await getS3Object(templateBucket, templateKey)
  } catch (error) {
    console.log(` Template not found: ${templateKey}, using default`)
    template = getDefaultTemplate(type)
  }

  // Process template with data
  const templateData = {
    userName,
    ...data,
    year: new Date().getFullYear(),
    creditLimit: data.creditLimit || "N/A", // Declare creditLimit variable
    amount: data.amount || "N/A", // Declare amount variable
    newBalance: data.newBalance || "N/A", // Declare newBalance variable
    remainingDebt: data.remainingDebt || "N/A", // Declare remainingDebt variable
    availableCredit: data.availableCredit || "N/A", // Declare availableCredit variable
  }

  const htmlBody = processTemplate(template, templateData)
  const subject = getTemplateSubject(type)

  // Send email
  await sendEmail({
    to: userEmail,
    subject: subject,
    htmlBody: htmlBody,
  })

  console.log(` Email sent to: ${userEmail}`)

  // Save notification record
  const notificationId = uuidv4()
  const notificationRecord: NotificationRecord = {
    uuid: notificationId,
    type: type,
    payload: JSON.stringify(data),
    status: "SENT",
    createdAt: new Date().toISOString(),
  }

  await docClient.send(
    new PutCommand({
      TableName: process.env.NOTIFICATION_TABLE_NAME!,
      Item: notificationRecord,
    }),
  )

  console.log(` Notification record saved: ${notificationId}`)
}

function getDefaultTemplate(type: string): string {
  const templates: Record<string, string> = {
    WELCOME: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #4CAF50;">Welcome to Inferno Bank!</h1>
          <p>Hello {{userName}},</p>
          <p>Thank you for joining Inferno Bank. We're excited to have you as part of our community.</p>
          <p>Your account has been created successfully, and your cards are being processed.</p>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
    "USER.LOGIN": `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1>New Login Detected</h1>
          <p>Hello {{userName}},</p>
          <p>We detected a new login to your Inferno Bank account at {{loginTime}}.</p>
          <p>If this wasn't you, please contact us immediately.</p>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
    "USER.UPDATE": `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1>Profile Updated</h1>
          <p>Hello {{userName}},</p>
          <p>Your profile has been updated successfully.</p>
          <p>If you didn't make these changes, please contact us immediately.</p>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
    "CARD.CREATE": `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #2196F3;">Your New Card is Ready!</h1>
          <p>Hello {{userName}},</p>
          <p>Great news! Your {{cardType}} card has been created.</p>
          <p><strong>Card ID:</strong> {{cardId}}</p>
          <p><strong>Status:</strong> {{status}}</p>
          <p>You can start using your card right away.</p>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
    "CARD.ACTIVATE": `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #4CAF50;">Card Activated!</h1>
          <p>Hello {{userName}},</p>
          <p>Congratulations! Your credit card has been activated.</p>
          <p><strong>Card ID:</strong> {{cardId}}</p>
          <p><strong>Credit Limit:</strong> $ {{creditLimit}}</p>
          <p>You can now use your credit card for purchases.</p>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
    "TRANSACTION.PURCHASE": `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1>Purchase Confirmation</h1>
          <p>Hello {{userName}},</p>
          <p>Your purchase has been processed successfully.</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
          <p><strong>Merchant:</strong> {{merchant}}</p>
          <p><strong>Amount:</strong> $ {{amount}}</p>
          <p><strong>Card Type:</strong> {{cardType}}</p>
          <p>Thank you for using Inferno Bank.</p>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
    "TRANSACTION.SAVE": `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #4CAF50;">Savings Confirmation</h1>
          <p>Hello {{userName}},</p>
          <p>Your savings transaction has been processed successfully.</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
          <p><strong>Amount Saved:</strong> $ {{amount}}</p>
          <p><strong>New Balance:</strong> $ {{newBalance}}</p>
          <p>Great job saving with Inferno Bank!</p>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
    "TRANSACTION.PAID": `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #2196F3;">Payment Confirmation</h1>
          <p>Hello {{userName}},</p>
          <p>Your credit card payment has been processed successfully.</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
          <p><strong>Payment Amount:</strong> $ {{amount}}</p>
          <p><strong>Remaining Debt:</strong> $ {{remainingDebt}}</p>
          <p><strong>Available Credit:</strong> $ {{availableCredit}}</p>
          <p>Thank you for your payment!</p>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
    "REPORT.ACTIVITY": `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1>Your Transaction Report is Ready</h1>
          <p>Hello {{userName}},</p>
          <p>Your transaction report has been generated successfully.</p>
          <p><strong>Period:</strong> {{reportPeriod.start}} to {{reportPeriod.end}}</p>
          <p><strong>Transactions:</strong> {{transactionCount}}</p>
          <p><strong>Download Reports:</strong></p>
          <ul>
            <li><a href="{{csvUrl}}">CSV Format</a></li>
            <li><a href="{{htmlUrl}}">HTML Format</a></li>
          </ul>
          <p>Best regards,<br>The Inferno Bank Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
        </body>
      </html>
    `,
  }

  return (
    templates[type] ||
    `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1>Notification from Inferno Bank</h1>
        <p>Hello {{userName}},</p>
        <p>This is a notification from Inferno Bank.</p>
        <p>Best regards,<br>The Inferno Bank Team</p>
        <hr>
        <p style="font-size: 12px; color: #666;">© {{year}} Inferno Bank. All rights reserved.</p>
      </body>
    </html>
  `
  )
}
