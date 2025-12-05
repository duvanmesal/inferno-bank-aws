output "user_service_role_arn" {
  value = aws_iam_role.user_service_role.arn
}

output "card_service_role_arn" {
  value = aws_iam_role.card_service_role.arn
}

output "notification_service_role_arn" {
  value = aws_iam_role.notification_service_role.arn
}
