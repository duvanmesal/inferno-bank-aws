import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const secretCache = new Map<string, any>()

export const getSecret = async (secretArn: string): Promise<any> => {
  if (secretCache.has(secretArn)) {
    return secretCache.get(secretArn)
  }

  const command = new GetSecretValueCommand({ SecretId: secretArn })
  const response = await client.send(command)

  if (!response.SecretString) {
    throw new Error("Secret not found")
  }

  const secret = JSON.parse(response.SecretString)
  secretCache.set(secretArn, secret)

  return secret
}
