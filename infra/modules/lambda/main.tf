# User Service Lambdas
resource "aws_lambda_function" "register_user" {
  function_name    = "register-user-lambda-${var.env}"
  role             = var.user_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.registerHandler"
  filename         = "${path.module}/../../../services/user-service/dist/user-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/user-service/dist/user-service.zip") ? filebase64sha256("${path.module}/../../../services/user-service/dist/user-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      USER_TABLE_NAME           = var.user_table_name
      CREATE_REQUEST_CARD_QUEUE = var.create_request_card_queue_url
      NOTIFICATION_EMAIL_QUEUE  = var.notification_email_queue_url
      JWT_SECRET_ARN            = var.jwt_secret_arn
      PASSWORD_SECRET_ARN       = var.password_secret_arn
      AVATARS_BUCKET            = var.avatars_bucket_name
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "login_user" {
  function_name    = "login-user-lambda-${var.env}"
  role             = var.user_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.loginHandler"
  filename         = "${path.module}/../../../services/user-service/dist/user-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/user-service/dist/user-service.zip") ? filebase64sha256("${path.module}/../../../services/user-service/dist/user-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      USER_TABLE_NAME          = var.user_table_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
      JWT_SECRET_ARN           = var.jwt_secret_arn
      PASSWORD_SECRET_ARN      = var.password_secret_arn
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "card_get_by_user" {
  function_name    = "card-get-by-user-lambda-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardGetByUserHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      CARD_TABLE_NAME          = var.card_table_name
      TRANSACTION_TABLE_NAME   = var.transaction_table_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "update_user" {
  function_name    = "update-user-lambda-${var.env}"
  role             = var.user_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.updateProfileHandler"
  filename         = "${path.module}/../../../services/user-service/dist/user-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/user-service/dist/user-service.zip") ? filebase64sha256("${path.module}/../../../services/user-service/dist/user-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      USER_TABLE_NAME          = var.user_table_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
      JWT_SECRET_ARN           = var.jwt_secret_arn
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "upload_avatar_user" {
  function_name    = "upload-avatar-user-lambda-${var.env}"
  role             = var.user_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.uploadAvatarHandler"
  filename         = "${path.module}/../../../services/user-service/dist/user-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/user-service/dist/user-service.zip") ? filebase64sha256("${path.module}/../../../services/user-service/dist/user-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      USER_TABLE_NAME = var.user_table_name
      JWT_SECRET_ARN  = var.jwt_secret_arn
      AVATARS_BUCKET  = var.avatars_bucket_name
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "get_profile_user" {
  function_name    = "get-profile-user-lambda-${var.env}"
  role             = var.user_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.getProfileHandler"
  filename         = "${path.module}/../../../services/user-service/dist/user-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/user-service/dist/user-service.zip") ? filebase64sha256("${path.module}/../../../services/user-service/dist/user-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      USER_TABLE_NAME = var.user_table_name
      JWT_SECRET_ARN  = var.jwt_secret_arn
    }
  }

  tags = var.tags
}

# Card Service Lambdas
resource "aws_lambda_function" "card_approval_worker" {
  function_name    = "card-approval-worker-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardApprovalHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      CARD_TABLE_NAME          = var.card_table_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
    }
  }

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "card_approval_mapping" {
  event_source_arn = var.create_request_card_queue_arn
  function_name    = aws_lambda_function.card_approval_worker.arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_function" "card_request_failed" {
  function_name    = "card-request-failed-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardRequestFailedHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      CARD_ERROR_TABLE_NAME = var.card_error_table_name
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "card_activate" {
  function_name    = "card-activate-lambda-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardActivateHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      CARD_TABLE_NAME          = var.card_table_name
      TRANSACTION_TABLE_NAME   = var.transaction_table_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "card_purchase" {
  function_name    = "card-purchase-lambda-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardPurchaseHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      CARD_TABLE_NAME          = var.card_table_name
      TRANSACTION_TABLE_NAME   = var.transaction_table_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "card_transaction_save" {
  function_name    = "card-transaction-save-lambda-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardTransactionSaveHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      CARD_TABLE_NAME          = var.card_table_name
      TRANSACTION_TABLE_NAME   = var.transaction_table_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "card_paid_credit_card" {
  function_name    = "card-paid-credit-card-lambda-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardPaidCreditHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      CARD_TABLE_NAME          = var.card_table_name
      TRANSACTION_TABLE_NAME   = var.transaction_table_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "card_get_report" {
  function_name    = "card-get-report-lambda-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardGetReportHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 60
  memory_size      = 1024

  environment {
    variables = {
      CARD_TABLE_NAME          = var.card_table_name
      TRANSACTION_TABLE_NAME   = var.transaction_table_name
      REPORTS_BUCKET           = var.reports_bucket_name
      NOTIFICATION_EMAIL_QUEUE = var.notification_email_queue_url
    }
  }

  tags = var.tags
}

# 🔥 NUEVA LAMBDA: GET /cards/{card_id}
resource "aws_lambda_function" "card_get" {
  function_name    = "card-get-lambda-${var.env}"
  role             = var.card_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.cardGetHandler"
  filename         = "${path.module}/../../../services/card-service/dist/card-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/card-service/dist/card-service.zip") ? filebase64sha256("${path.module}/../../../services/card-service/dist/card-service.zip") : null
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      CARD_TABLE_NAME = var.card_table_name
    }
  }

  tags = var.tags
}

# Notification Service Lambdas
resource "aws_lambda_function" "send_notifications" {
  function_name    = "send-notifications-lambda-${var.env}"
  role             = var.notification_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.sendNotificationsHandler"
  filename         = "${path.module}/../../../services/notification-service/dist/notification-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/notification-service/dist/notification-service.zip") ? filebase64sha256("${path.module}/../../../services/notification-service/dist/notification-service.zip") : null
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      USER_TABLE_NAME         = var.user_table_name
      NOTIFICATION_TABLE_NAME = var.notification_table_name
      TEMPLATES_BUCKET        = var.templates_bucket_name
      FROM_EMAIL              = "noreply@infernobank.com"
    }
  }

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "notification_mapping" {
  event_source_arn = var.notification_email_queue_arn
  function_name    = aws_lambda_function.send_notifications.arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_function" "send_notifications_error" {
  function_name    = "send-notifications-error-lambda-${var.env}"
  role             = var.notification_service_role_arn
  runtime          = "nodejs20.x"
  handler          = "index.sendNotificationsErrorHandler"
  filename         = "${path.module}/../../../services/notification-service/dist/notification-service.zip"
  source_code_hash = fileexists("${path.module}/../../../services/notification-service/dist/notification-service.zip") ? filebase64sha256("${path.module}/../../../services/notification-service/dist/notification-service.zip") : null
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      NOTIFICATION_ERROR_TABLE_NAME = var.notification_error_table_name
    }
  }

  tags = var.tags
}
