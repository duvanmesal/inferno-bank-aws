# API Gateway HTTP API
resource "aws_apigatewayv2_api" "http_api" {
  name          = "inferno-bank-api-${var.env}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }

  tags = var.tags
}

# Default Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = var.tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/inferno-bank-${var.env}"
  retention_in_days = 7
  tags              = var.tags
}

# User Service Integrations
resource "aws_apigatewayv2_integration" "register_user" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.register_user_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "register_user" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /register"
  target    = "integrations/${aws_apigatewayv2_integration.register_user.id}"
}

resource "aws_lambda_permission" "register_user" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.register_user_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "login_user" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.login_user_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "login_user" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /login"
  target    = "integrations/${aws_apigatewayv2_integration.login_user.id}"
}

resource "aws_lambda_permission" "login_user" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.login_user_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "update_user" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.update_user_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "update_user" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "PUT /profile/{user_id}"
  target    = "integrations/${aws_apigatewayv2_integration.update_user.id}"
}

resource "aws_lambda_permission" "update_user" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.update_user_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "upload_avatar_user" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.upload_avatar_user_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upload_avatar_user" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /profile/{user_id}/avatar"
  target    = "integrations/${aws_apigatewayv2_integration.upload_avatar_user.id}"
}

resource "aws_lambda_permission" "upload_avatar_user" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.upload_avatar_user_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "get_profile_user" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.get_profile_user_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_profile_user" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /profile/{user_id}"
  target    = "integrations/${aws_apigatewayv2_integration.get_profile_user.id}"
}

resource "aws_lambda_permission" "get_profile_user" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.get_profile_user_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# Card Service Integrations
resource "aws_apigatewayv2_integration" "card_activate" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.card_activate_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "card_activate" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /card/activate"
  target    = "integrations/${aws_apigatewayv2_integration.card_activate.id}"
}

resource "aws_lambda_permission" "card_activate" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.card_activate_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "card_purchase" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.card_purchase_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "card_purchase" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /transactions/purchase"
  target    = "integrations/${aws_apigatewayv2_integration.card_purchase.id}"
}

resource "aws_lambda_permission" "card_purchase" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.card_purchase_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "card_transaction_save" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.card_transaction_save_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "card_transaction_save" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /transactions/save/{card_id}"
  target    = "integrations/${aws_apigatewayv2_integration.card_transaction_save.id}"
}

resource "aws_lambda_permission" "card_transaction_save" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.card_transaction_save_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "card_paid_credit_card" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.card_paid_credit_card_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "card_paid_credit_card" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /card/paid/{card_id}"
  target    = "integrations/${aws_apigatewayv2_integration.card_paid_credit_card.id}"
}

resource "aws_lambda_permission" "card_paid_credit_card" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.card_paid_credit_card_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "card_get_report" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.card_get_report_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "card_get_report" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /card/{card_id}/report"
  target    = "integrations/${aws_apigatewayv2_integration.card_get_report.id}"
}

resource "aws_lambda_permission" "card_get_report" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.card_get_report_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# === Card Get by ID ===
resource "aws_apigatewayv2_integration" "card_get" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.card_get_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "card_get" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /cards/{card_id}"
  target    = "integrations/${aws_apigatewayv2_integration.card_get.id}"
}

resource "aws_lambda_permission" "card_get" {
  statement_id  = "AllowAPIGatewayInvokeCardGet"
  action        = "lambda:InvokeFunction"
  function_name = var.card_get_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# GET /users/{user_id}/cards
resource "aws_apigatewayv2_integration" "card_get_by_user" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.card_get_by_user_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "card_get_by_user" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /users/{user_id}/cards"
  target    = "integrations/${aws_apigatewayv2_integration.card_get_by_user.id}"
}

resource "aws_lambda_permission" "card_get_by_user" {
  statement_id  = "AllowAPIGatewayInvokeCardGetByUser"
  action        = "lambda:InvokeFunction"
  function_name = var.card_get_by_user_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# === Security PIN Set ===
resource "aws_apigatewayv2_integration" "security_pin_set" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.security_pin_set_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "security_pin_set" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /security/pin/set"
  target    = "integrations/${aws_apigatewayv2_integration.security_pin_set.id}"
}

resource "aws_lambda_permission" "security_pin_set" {
  statement_id  = "AllowAPIGatewayInvokeSecurityPinSet"
  action        = "lambda:InvokeFunction"
  function_name = var.security_pin_set_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# === Security PIN Verify CVV ===
resource "aws_apigatewayv2_integration" "security_pin_verify_cvv" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.security_pin_verify_cvv_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "security_pin_verify_cvv" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /security/pin/verify-cvv"
  target    = "integrations/${aws_apigatewayv2_integration.security_pin_verify_cvv.id}"
}

resource "aws_lambda_permission" "security_pin_verify_cvv" {
  statement_id  = "AllowAPIGatewayInvokeSecurityPinVerifyCvv"
  action        = "lambda:InvokeFunction"
  function_name = var.security_pin_verify_cvv_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# === Card Get by Number ===
resource "aws_apigatewayv2_integration" "card_get_by_number" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.card_get_by_number_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "card_get_by_number" {
  api_id    = aws_apigatewayv2_api.http_api.id
  # 👇 usamos {card_number} porque tu handler soporta cardNumber y card_number
  route_key = "GET /cards/by-number/{card_number}"
  target    = "integrations/${aws_apigatewayv2_integration.card_get_by_number.id}"
}

resource "aws_lambda_permission" "card_get_by_number" {
  statement_id  = "AllowAPIGatewayInvokeCardGetByNumber"
  action        = "lambda:InvokeFunction"
  function_name = var.card_get_by_number_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
