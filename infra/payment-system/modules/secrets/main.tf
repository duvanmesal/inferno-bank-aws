# JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.project_name}-jwt-secret-${var.env}"
  recovery_window_in_days = var.env == "prod" ? 30 : 0

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret_value" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    key = var.jwt_secret_key
  })
}

# Password Secret (BCrypt configuration)
resource "aws_secretsmanager_secret" "password_secret" {
  name                    = "password-secret-${var.env}"
  recovery_window_in_days = var.env == "prod" ? 30 : 0

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "password_secret_value" {
  secret_id = aws_secretsmanager_secret.password_secret.id
  secret_string = jsonencode({
    rounds = var.password_bcrypt_rounds
  })
}
