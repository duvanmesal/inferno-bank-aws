import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" })

export const uploadToS3 = async (bucket: string, key: string, body: Buffer, contentType: string): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  })

  await client.send(command)

  return `https://${bucket}.s3.amazonaws.com/${key}`
}

export const getPresignedUrl = async (bucket: string, key: string, expiresIn = 3600): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  return await getSignedUrl(client, command, { expiresIn })
}
