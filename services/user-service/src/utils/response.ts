export interface APIResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

export const createResponse = (statusCode: number, data: any): APIResponse => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
  },
  body: JSON.stringify(data),
})

export const successResponse = (data: any, statusCode = 200): APIResponse => createResponse(statusCode, data)

export const errorResponse = (code: string, message: string, details?: any, statusCode = 400): APIResponse =>
  createResponse(statusCode, {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  })
