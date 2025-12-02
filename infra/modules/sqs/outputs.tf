output "create_request_card_queue_url" {
  value = aws_sqs_queue.create_request_card.url
}

output "create_request_card_arn" {
  value = aws_sqs_queue.create_request_card.arn
}

output "create_request_card_dlq_arn" {
  value = aws_sqs_queue.create_request_card_dlq.arn
}

output "notification_email_queue_url" {
  value = aws_sqs_queue.notification_email.url
}

output "notification_email_arn" {
  value = aws_sqs_queue.notification_email.arn
}

output "notification_email_dlq_arn" {
  value = aws_sqs_queue.notification_email_dlq.arn
}
