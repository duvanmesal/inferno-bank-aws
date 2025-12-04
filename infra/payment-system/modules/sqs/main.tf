# Create Request Card Queue with DLQ
resource "aws_sqs_queue" "create_request_card_dlq" {
  name                      = "create-request-card-dlq-${var.env}"
  message_retention_seconds = 1209600 # 14 days

  tags = var.tags
}

resource "aws_sqs_queue" "create_request_card" {
  name                       = "create-request-card-sqs-${var.env}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 345600 # 4 days
  receive_wait_time_seconds  = 10

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.create_request_card_dlq.arn
    maxReceiveCount     = 5
  })

  tags = var.tags
}

# Notification Email Queue with DLQ
resource "aws_sqs_queue" "notification_email_dlq" {
  name                      = "notification-email-error-sqs-${var.env}"
  message_retention_seconds = 1209600 # 14 days

  tags = var.tags
}

resource "aws_sqs_queue" "notification_email" {
  name                       = "notification-email-sqs-${var.env}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 345600 # 4 days
  receive_wait_time_seconds  = 10

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_email_dlq.arn
    maxReceiveCount     = 5
  })

  tags = var.tags
}
