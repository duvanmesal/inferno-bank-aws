# DLQs
resource "aws_sqs_queue" "start_payment_dlq" {
  name = "${var.project_name}-start-payment-dlq-${var.environment}"

  message_retention_seconds = 1209600 # 14 días

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-start-payment-dlq-${var.environment}"
  })
}

resource "aws_sqs_queue" "check_balance_dlq" {
  name = "${var.project_name}-check-balance-dlq-${var.environment}"

  message_retention_seconds = 1209600

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-check-balance-dlq-${var.environment}"
  })
}

resource "aws_sqs_queue" "transaction_dlq" {
  name = "${var.project_name}-transaction-dlq-${var.environment}"

  message_retention_seconds = 1209600

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-transaction-dlq-${var.environment}"
  })
}

# Colas principales
resource "aws_sqs_queue" "start_payment" {
  name = "${var.project_name}-start-payment-${var.environment}"

  visibility_timeout_seconds = 120
  message_retention_seconds  = 345600 # 4 días

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.start_payment_dlq.arn
    maxReceiveCount     = 5
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-start-payment-${var.environment}"
  })
}

resource "aws_sqs_queue" "check_balance" {
  name = "${var.project_name}-check-balance-${var.environment}"

  visibility_timeout_seconds = 120
  message_retention_seconds  = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.check_balance_dlq.arn
    maxReceiveCount     = 5
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-check-balance-${var.environment}"
  })
}

resource "aws_sqs_queue" "transaction" {
  name = "${var.project_name}-transaction-${var.environment}"

  visibility_timeout_seconds = 120
  message_retention_seconds  = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.transaction_dlq.arn
    maxReceiveCount     = 5
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-transaction-${var.environment}"
  })
}
