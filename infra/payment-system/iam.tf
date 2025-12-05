resource "aws_iam_role" "payment_lambda_role" {
  name = "${var.project_name}-payment-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-lambda-role-${var.environment}"
  })
}

data "aws_iam_policy_document" "payment_lambda_policy" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = ["*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.catalog.arn,
      "${aws_s3_bucket.catalog.arn}/*",
    ]
  }

  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]

    resources = [
      aws_dynamodb_table.payment.arn,
    ]
  }

  statement {
    effect = "Allow"

    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]

    resources = [
      aws_sqs_queue.start_payment.arn,
      aws_sqs_queue.check_balance.arn,
      aws_sqs_queue.transaction.arn,
    ]
  }

  statement {
    effect = "Allow"

    actions = [
      "ec2:DescribeNetworkInterfaces",
      "ec2:CreateNetworkInterface",
      "ec2:DeleteNetworkInterface",
      "ec2:DescribeInstances",
      "ec2:AttachNetworkInterface",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "payment_lambda_policy" {
  name   = "${var.project_name}-payment-lambda-policy-${var.environment}"
  policy = data.aws_iam_policy_document.payment_lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "payment_lambda_role_attach" {
  role       = aws_iam_role.payment_lambda_role.name
  policy_arn = aws_iam_policy.payment_lambda_policy.arn
}
