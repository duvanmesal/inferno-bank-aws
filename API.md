# Inferno Bank API Documentation

Base URL: `https://[api-id].execute-api.us-east-1.amazonaws.com`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

## Error Response Format

All errors follow this format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "fieldName",
      "issue": "specific issue"
    }
  }
}
\`\`\`

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Server error

---

## User Endpoints

### POST /register

Register a new user account.

**Request:**
\`\`\`json
{
  "name": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "document": "1234567890"
}
\`\`\`

**Validations:**
- Email must be valid format
- Password minimum 8 characters
- Document must be numeric, minimum 5 characters
- Email and document must be unique

**Response:** `201 Created`
\`\`\`json
{
  "uuid": "b31e7bd3-0b03-48be-a720-de1d4ca4a96c",
  "name": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "document": "1234567890"
}
\`\`\`

**Side Effects:**
- Creates 2 cards automatically (DEBIT activated, CREDIT pending)
- Sends welcome email
- Sends card creation notifications

---

### POST /login

Authenticate user and get JWT token.

**Request:**
\`\`\`json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
\`\`\`

**Response:** `200 OK`
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
\`\`\`

**Token Payload:**
\`\`\`json
{
  "sub": "user-uuid",
  "email": "jane@example.com",
  "document": "1234567890",
  "iat": 1234567890,
  "exp": 1234571490
}
\`\`\`

**Side Effects:**
- Sends login notification email

---

### PUT /profile/{user_id}

Update user profile information.

**Authentication:** Required  
**Authorization:** User can only update their own profile

**Request:**
\`\`\`json
{
  "address": "123 Main St",
  "phone": "555-0123"
}
\`\`\`

**Response:** `200 OK`
\`\`\`json
{
  "message": "Profile updated successfully"
}
\`\`\`

**Side Effects:**
- Sends profile update notification email

---

### POST /profile/{user_id}/avatar

Upload user avatar image.

**Authentication:** Required  
**Authorization:** User can only upload their own avatar

**Request:**
\`\`\`json
{
  "image": "base64-encoded-image-data",
  "fileType": "image/jpeg"
}
\`\`\`

**Validations:**
- fileType must be: `image/jpeg`, `image/jpg`, or `image/png`
- image must be valid base64

**Response:** `200 OK`
\`\`\`json
{
  "imageUrl": "https://inferno-bank-avatars-dev.s3.amazonaws.com/avatars/user-id/12345.jpg"
}
\`\`\`

---

### GET /profile/{user_id}

Get user profile information.

**Authentication:** Required

**Response:** `200 OK`
\`\`\`json
{
  "uuid": "b31e7bd3-0b03-48be-a720-de1d4ca4a96c",
  "name": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "document": "1234567890",
  "address": "123 Main St",
  "phone": "555-0123",
  "image": "https://..."
}
\`\`\`

---

## Card Endpoints

### POST /card/activate

Activate a credit card (requires 10+ purchases).

**Authentication:** Optional (but userId required)

**Request:**
\`\`\`json
{
  "userId": "b31e7bd3-0b03-48be-a720-de1d4ca4a96c"
}
\`\`\`

**Validation:**
- User must have completed at least 10 PURCHASE transactions
- Credit card must exist and be in PENDING status

**Response:** `200 OK`
\`\`\`json
{
  "message": "Credit card activated successfully",
  "card": {
    "uuid": "48a8d8d1-73e1-41ed-92e4-6157377542e9",
    "status": "ACTIVATED",
    "creditLimit": 5000000
  }
}
\`\`\`

**Errors:**
- `403 FORBIDDEN` if less than 10 purchases

**Side Effects:**
- Sends card activation notification email

---

### POST /transactions/purchase

Make a purchase with a card.

**Request:**
\`\`\`json
{
  "merchant": "Amazon",
  "cardId": "48a8d8d1-73e1-41ed-92e4-6157377542e9",
  "amount": 100.50
}
\`\`\`

**Validations:**
- Card must be ACTIVATED
- **DEBIT:** balance >= amount
- **CREDIT:** (limit - used) >= amount

**Response:** `201 Created`
\`\`\`json
{
  "message": "Purchase successful",
  "transaction": {
    "uuid": "33d19bcb-148f-47b1-b963-77602eaf7ae5",
    "amount": 100.50,
    "merchant": "Amazon",
    "type": "PURCHASE",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
\`\`\`

**Errors:**
- `403 FORBIDDEN` if insufficient balance/credit

**Side Effects:**
- Updates card balance/usedBalance
- Creates transaction record
- Sends purchase notification email

---

### POST /transactions/save/{card_id}

Add savings to a debit card.

**Request:**
\`\`\`json
{
  "merchant": "SAVING",
  "amount": 500.00
}
\`\`\`

**Validations:**
- Card must be DEBIT type
- Card must be ACTIVATED
- Amount must be positive

**Response:** `201 Created`
\`\`\`json
{
  "message": "Saving transaction successful",
  "transaction": {
    "uuid": "...",
    "amount": 500.00,
    "merchant": "SAVING",
    "type": "SAVING",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "newBalance": 1500.00
}
\`\`\`

**Errors:**
- `403 FORBIDDEN` if card is CREDIT type

**Side Effects:**
- Increases card balance
- Creates transaction record
- Sends savings notification email

---

### POST /card/paid/{card_id}

Make a payment towards credit card balance.

**Request:**
\`\`\`json
{
  "merchant": "PSE",
  "amount": 1000.00
}
\`\`\`

**Validations:**
- Card must be CREDIT type
- Card must be ACTIVATED
- Amount must be positive

**Response:** `201 Created`
\`\`\`json
{
  "message": "Payment successful",
  "transaction": {
    "uuid": "...",
    "amount": 1000.00,
    "merchant": "PSE",
    "type": "PAYMENT_BALANCE",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "remainingDebt": 500.00,
  "availableCredit": 4500.00
}
\`\`\`

**Note:** If payment amount > used balance, only the used balance is paid.

**Side Effects:**
- Decreases card usedBalance
- Creates transaction record
- Sends payment notification email

---

### POST /card/{card_id}/report

Generate transaction report for a date range.

**Request:**
\`\`\`json
{
  "start": "2025-01-01T00:00:00.000Z",
  "end": "2025-01-31T23:59:59.999Z"
}
\`\`\`

**Validations:**
- Dates must be valid ISO8601 format
- start must be before end

**Response:** `200 OK`
\`\`\`json
{
  "message": "Report generated successfully",
  "period": {
    "start": "2025-01-01T00:00:00.000Z",
    "end": "2025-01-31T23:59:59.999Z"
  },
  "transactionCount": 25,
  "reports": {
    "csv": "https://inferno-bank-transactions-report-dev.s3.amazonaws.com/reports/card-id/12345.csv",
    "html": "https://inferno-bank-transactions-report-dev.s3.amazonaws.com/reports/card-id/12345.html"
  }
}
\`\`\`

**Side Effects:**
- Generates CSV and HTML reports
- Uploads reports to S3
- Sends report notification email with download links

---

## Rate Limits

Currently no rate limits enforced. Consider implementing in production:

- API Gateway: 10,000 requests/second (burst)
- Lambda: 1,000 concurrent executions per region

## Pagination

Currently not implemented. All queries return full result sets. Consider implementing for:

- Transaction history
- Card listings

## Webhooks

Not currently implemented. Consider for:

- Transaction notifications
- Card status changes
- Failed payment attempts

## Versioning

API is currently v1 (unversioned). Future versions should use:

- URL versioning: `/v2/register`
- Header versioning: `Accept: application/vnd.infernobank.v2+json`
\`\`\`
