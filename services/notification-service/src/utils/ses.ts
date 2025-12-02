import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

const client = new SESClient({ region: process.env.AWS_REGION || "us-east-1" })

export interface EmailOptions {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  from?: string
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const fromEmail = options.from || process.env.FROM_EMAIL || "noreply@infernobank.com"

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [options.to],
    },
    Message: {
      Subject: {
        Data: options.subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: options.htmlBody,
          Charset: "UTF-8",
        },
        ...(options.textBody && {
          Text: {
            Data: options.textBody,
            Charset: "UTF-8",
          },
        }),
      },
    },
  })

  await client.send(command)
}
