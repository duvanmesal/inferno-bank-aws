resource "aws_api_gateway_rest_api" "payment_api" {
  name        = "${var.project_name}-payment-api-${var.environment}"
  description = "API del sistema de pagos (2do corte)"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-api-${var.environment}"
  })
}

# /catalog
resource "aws_api_gateway_resource" "catalog" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "catalog"
}

# GET /catalog
resource "aws_api_gateway_method" "catalog_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.catalog.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "catalog_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.catalog.id
  http_method             = aws_api_gateway_method.catalog_get_method.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.catalog_get.invoke_arn
}

# POST /catalog/update
resource "aws_api_gateway_resource" "catalog_update" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_resource.catalog.id
  path_part   = "update"
}

resource "aws_api_gateway_method" "catalog_update_method" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.catalog_update.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "catalog_update_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.catalog_update.id
  http_method             = aws_api_gateway_method.catalog_update_method.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.catalog_update.invoke_arn
}

# /payment
resource "aws_api_gateway_resource" "payment" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "payment"
}

# POST /payment
resource "aws_api_gateway_method" "payment_post_method" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.payment.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payment_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.payment.id
  http_method             = aws_api_gateway_method.payment_post_method.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.payment_api.invoke_arn
}

# GET /payment/{traceId}
resource "aws_api_gateway_resource" "payment_by_trace" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_resource.payment.id
  path_part   = "{traceId}"
}

resource "aws_api_gateway_method" "payment_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.payment_by_trace.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.traceId" = true
  }
}

resource "aws_api_gateway_integration" "payment_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.payment_by_trace.id
  http_method             = aws_api_gateway_method.payment_get_method.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.payment_api.invoke_arn

  request_parameters = {
    "integration.request.path.traceId" = "method.request.path.traceId"
  }
}

# Deployment + Stage
resource "aws_api_gateway_deployment" "payment_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id

  # Nos aseguramos que primero existan métodos e integraciones
  depends_on = [
    aws_api_gateway_method.catalog_get_method,
    aws_api_gateway_integration.catalog_get_integration,
    aws_api_gateway_method.catalog_update_method,
    aws_api_gateway_integration.catalog_update_integration,
    aws_api_gateway_method.payment_post_method,
    aws_api_gateway_integration.payment_post_integration,
    aws_api_gateway_method.payment_get_method,
    aws_api_gateway_integration.payment_get_integration,
  ]

  # Trigger para forzar redeploy cuando cambian los métodos
  triggers = {
    redeploy = sha1(jsonencode([
      aws_api_gateway_method.catalog_get_method.id,
      aws_api_gateway_method.catalog_update_method.id,
      aws_api_gateway_method.payment_post_method.id,
      aws_api_gateway_method.payment_get_method.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "payment_api_stage" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  deployment_id = aws_api_gateway_deployment.payment_api_deployment.id
  stage_name    = var.environment

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-api-stage-${var.environment}"
  })
}

# Permisos para que API Gateway invoque Lambdas

resource "aws_lambda_permission" "apigw_invoke_catalog_get" {
  statement_id  = "AllowAPIGatewayInvokeCatalogGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.catalog_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_invoke_catalog_update" {
  statement_id  = "AllowAPIGatewayInvokeCatalogUpdate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.catalog_update.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_invoke_payment_api" {
  statement_id  = "AllowAPIGatewayInvokePaymentAPI"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}
