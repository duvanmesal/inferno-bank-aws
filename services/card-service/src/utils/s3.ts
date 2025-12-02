import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" })

export const uploadToS3 = async (
  bucket: string,
  key: string,
  body: Buffer | string,
  contentType: string,
): Promise<string> => {
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
