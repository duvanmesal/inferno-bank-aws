import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" })

export const getS3Object = async (bucket: string, key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  const response = await client.send(command)

  if (!response.Body) {
    throw new Error("Empty S3 object body")
  }

  return await response.Body.transformToString()
}
