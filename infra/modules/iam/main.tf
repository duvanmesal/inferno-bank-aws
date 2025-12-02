# IAM Assume Role Policy for Lambda
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# User Service Role
resource "aws_iam_role" "user_service_role" {
  name               = "user-service-lambda-role-${var.env}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "user_service_policy" {
  statement {
    sid = "DynamoDBAccess"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [
      var.user_table_arn,
      "${var.user_table_arn}/index/*"
    ]
  }

  statement {
    sid = "S3Access"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ]
    resources = [
      "${var.avatars_bucket_arn}/*"
    ]
  }

  statement {
    sid = "SecretsAccess"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [
      var.password_secret_arn,
      var.jwt_secret_arn
    ]
  }

  statement {
    sid = "SQSAccess"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [
      var.create_request_card_arn,
      var.notification_email_arn
    ]
  }

  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "user_service_policy" {
  name   = "user-service-lambda-policy-${var.env}"
  policy = data.aws_iam_policy_document.user_service_policy.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "user_service_attach" {
  role       = aws_iam_role.user_service_role.name
  policy_arn = aws_iam_policy.user_service_policy.arn
}

# Card Service Role
resource "aws_iam_role" "card_service_role" {
  name               = "card-service-lambda-role-${var.env}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "card_service_policy" {
  statement {
    sid = "DynamoDBAccess"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [
      var.card_table_arn,
      "${var.card_table_arn}/index/*",
      var.transaction_table_arn,
      "${var.transaction_table_arn}/index/*",
      var.card_error_table_arn
    ]
  }

  statement {
    sid = "S3Access"
    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]
    resources = [
      "${var.reports_bucket_arn}/*"
    ]
  }

  statement {
    sid = "SQSReceive"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]
    resources = [
      var.create_request_card_arn,
      var.create_request_card_dlq_arn
    ]
  }

  statement {
    sid = "SQSSend"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [
      var.notification_email_arn
    ]
  }

  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "card_service_policy" {
  name   = "card-service-lambda-policy-${var.env}"
  policy = data.aws_iam_policy_document.card_service_policy.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "card_service_attach" {
  role       = aws_iam_role.card_service_role.name
  policy_arn = aws_iam_policy.card_service_policy.arn
}

# Notification Service Role
resource "aws_iam_role" "notification_service_role" {
  name               = "notification-service-lambda-role-${var.env}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "notification_service_policy" {
  statement {
    sid = "DynamoDBAccess"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:Query"
    ]
    resources = [
      var.user_table_arn,
      "${var.user_table_arn}/index/*",
      var.notification_table_arn,
      var.notification_error_table_arn
    ]
  }

  statement {
    sid = "S3Access"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "${var.templates_bucket_arn}/*"
    ]
  }

  statement {
    sid = "SQSAccess"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]
    resources = [
      var.notification_email_arn,
      var.notification_email_dlq_arn
    ]
  }

  statement {
    sid = "SESAccess"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]
    resources = ["*"]
  }

  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "notification_service_policy" {
  name   = "notification-service-lambda-policy-${var.env}"
  policy = data.aws_iam_policy_document.notification_service_policy.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "notification_service_attach" {
  role       = aws_iam_role.notification_service_role.name
  policy_arn = aws_iam_policy.notification_service_policy.arn
}
