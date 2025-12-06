# User Table
resource "aws_dynamodb_table" "user_table" {
  name         = "user-table-${var.env}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "document"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "document"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "document-index"
    hash_key        = "document"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

# Card Table
resource "aws_dynamodb_table" "card_table" {
  name         = "card-table-${var.env}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "createdAt"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  # atributo para número de tarjeta
  attribute {
    name = "cardNumber"
    type = "S"
  }

  # Index por usuario
  global_secondary_index {
    name            = "user-cards-index"
    hash_key        = "user_id"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  # GSI para buscar por número de tarjeta
  global_secondary_index {
    name            = "card-number-index"
    hash_key        = "cardNumber"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}


# Transaction Table
resource "aws_dynamodb_table" "transaction_table" {
  name         = "transaction-table-${var.env}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "createdAt"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "cardId"
    type = "S"
  }

  global_secondary_index {
    name            = "card-transactions-index"
    hash_key        = "cardId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

# Card Error Table
resource "aws_dynamodb_table" "card_error_table" {
  name         = "card-table-error-${var.env}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "createdAt"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

# Notification Table
resource "aws_dynamodb_table" "notification_table" {
  name         = "notification-table-${var.env}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "createdAt"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

# Notification Error Table
resource "aws_dynamodb_table" "notification_error_table" {
  name         = "notification-error-table-${var.env}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "createdAt"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}
