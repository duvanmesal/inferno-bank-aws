# Lambda: POST /payment y GET /payment/{traceId}
resource "aws_lambda_function" "payment_api" {
  function_name = "${var.project_name}-payment-api-${var.environment}"
  role          = aws_iam_role.payment_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = "${path.module}/../../dist/lambdas/payment-api.zip"
  source_code_hash = filebase64sha256("${path.module}/../../dist/lambdas/payment-api.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      PAYMENT_TABLE_NAME      = aws_dynamodb_table.payment.name
      START_PAYMENT_QUEUE_URL = aws_sqs_queue.start_payment.url
      CORE_BANK_BASE_URL      = var.core_bank_base_url
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-api-${var.environment}"
  })
}

# Worker: start-payment
resource "aws_lambda_function" "start_payment" {
  function_name = "${var.project_name}-start-payment-${var.environment}"
  role          = aws_iam_role.payment_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = "${path.module}/../../dist/lambdas/start-payment.zip"
  source_code_hash = filebase64sha256("${path.module}/../../dist/lambdas/start-payment.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      PAYMENT_TABLE_NAME      = aws_dynamodb_table.payment.name
      CHECK_BALANCE_QUEUE_URL = aws_sqs_queue.check_balance.url
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-start-payment-${var.environment}"
  })
}

# Worker: check-balance
resource "aws_lambda_function" "check_balance" {
  function_name = "${var.project_name}-check-balance-${var.environment}"
  role          = aws_iam_role.payment_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = "${path.module}/../../dist/lambdas/check-balance.zip"
  source_code_hash = filebase64sha256("${path.module}/../../dist/lambdas/check-balance.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      PAYMENT_TABLE_NAME    = aws_dynamodb_table.payment.name
      CORE_BANK_BASE_URL    = var.core_bank_base_url
      TRANSACTION_QUEUE_URL = aws_sqs_queue.transaction.url
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-check-balance-${var.environment}"
  })
}

# Worker: transaction
resource "aws_lambda_function" "transaction_worker" {
  function_name = "${var.project_name}-transaction-${var.environment}"
  role          = aws_iam_role.payment_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = "${path.module}/../../dist/lambdas/transaction.zip"
  source_code_hash = filebase64sha256("${path.module}/../../dist/lambdas/transaction.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      PAYMENT_TABLE_NAME = aws_dynamodb_table.payment.name
      CORE_BANK_BASE_URL = var.core_bank_base_url
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-transaction-${var.environment}"
  })
}

# Event source mappings SQS -> Lambdas

resource "aws_lambda_event_source_mapping" "start_payment_mapping" {
  event_source_arn = aws_sqs_queue.start_payment.arn
  function_name    = aws_lambda_function.start_payment.arn
  batch_size       = 1
}

resource "aws_lambda_event_source_mapping" "check_balance_mapping" {
  event_source_arn = aws_sqs_queue.check_balance.arn
  function_name    = aws_lambda_function.check_balance.arn
  batch_size       = 1
}

resource "aws_lambda_event_source_mapping" "transaction_mapping" {
  event_source_arn = aws_sqs_queue.transaction.arn
  function_name    = aws_lambda_function.transaction_worker.arn
  batch_size       = 1
}
