output "jwt_secret_arn" {
  value = aws_secretsmanager_secret.jwt_secret.arn
}

output "password_secret_arn" {
  value = aws_secretsmanager_secret.password_secret.arn
}
