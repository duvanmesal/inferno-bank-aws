# Lambda: POST /catalog/update
resource "aws_lambda_function" "catalog_update" {
  function_name = "${var.project_name}-catalog-update-${var.environment}"
  role          = aws_iam_role.payment_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = "${path.module}/../../dist/lambdas/catalog-update.zip"
  source_code_hash = filebase64sha256("${path.module}/../../dist/lambdas/catalog-update.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      CATALOG_BUCKET_NAME = aws_s3_bucket.catalog.bucket
      REDIS_HOST          = aws_elasticache_cluster.redis.cache_nodes[0].address
      REDIS_PORT          = aws_elasticache_cluster.redis.cache_nodes[0].port
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-catalog-update-${var.environment}"
  })
}

# Lambda: GET /catalog
resource "aws_lambda_function" "catalog_get" {
  function_name = "${var.project_name}-catalog-get-${var.environment}"
  role          = aws_iam_role.payment_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = "${path.module}/../../dist/lambdas/catalog-get.zip"
  source_code_hash = filebase64sha256("${path.module}/../../dist/lambdas/catalog-get.zip")

  timeout     = 10
  memory_size = 256

  environment {
    variables = {
      REDIS_HOST = aws_elasticache_cluster.redis.cache_nodes[0].address
      REDIS_PORT = aws_elasticache_cluster.redis.cache_nodes[0].port
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-catalog-get-${var.environment}"
  })
}
