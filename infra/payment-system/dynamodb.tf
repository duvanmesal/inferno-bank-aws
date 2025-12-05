resource "aws_dynamodb_table" "payment" {
  name         = var.payment_table_name != "" ? var.payment_table_name : "${var.project_name}-payment-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "traceId"

  attribute {
    name = "traceId"
    type = "S"
  }

  # Podrías añadir GSIs luego si quieres consultar por status o cardId

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-table-${var.environment}"
  })
}
