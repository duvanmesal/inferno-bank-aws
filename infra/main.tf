locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.env
    ManagedBy   = "Terraform"
  }
}

# DynamoDB Tables
module "dynamodb" {
  source = "./modules/dynamodb"
  env    = var.env
  tags   = local.common_tags
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"
  env    = var.env
  tags   = local.common_tags
}

# SQS Queues
module "sqs" {
  source = "./modules/sqs"
  env    = var.env
  tags   = local.common_tags
}

# Secrets Manager
module "secrets" {
  source                  = "./modules/secrets"
  env                     = var.env
  jwt_secret_key          = var.jwt_secret_key
  password_bcrypt_rounds  = var.password_bcrypt_rounds
  tags                    = local.common_tags
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"
  env    = var.env

  user_table_arn              = module.dynamodb.user_table_arn
  card_table_arn              = module.dynamodb.card_table_arn
  transaction_table_arn       = module.dynamodb.transaction_table_arn
  card_error_table_arn        = module.dynamodb.card_error_table_arn
  notification_table_arn      = module.dynamodb.notification_table_arn
  notification_error_table_arn = module.dynamodb.notification_error_table_arn

  avatars_bucket_arn          = module.s3.avatars_bucket_arn
  reports_bucket_arn          = module.s3.reports_bucket_arn
  templates_bucket_arn        = module.s3.templates_bucket_arn

  create_request_card_arn     = module.sqs.create_request_card_arn
  notification_email_arn      = module.sqs.notification_email_arn
  create_request_card_dlq_arn = module.sqs.create_request_card_dlq_arn
  notification_email_dlq_arn  = module.sqs.notification_email_dlq_arn

  jwt_secret_arn              = module.secrets.jwt_secret_arn
  password_secret_arn         = module.secrets.password_secret_arn

  tags = local.common_tags
}

# Lambda Functions
module "lambda" {
  source = "./modules/lambda"
  env    = var.env

  # IAM roles
  user_service_role_arn         = module.iam.user_service_role_arn
  card_service_role_arn         = module.iam.card_service_role_arn
  notification_service_role_arn = module.iam.notification_service_role_arn

  # DynamoDB tables
  user_table_name         = module.dynamodb.user_table_name
  card_table_name         = module.dynamodb.card_table_name
  transaction_table_name  = module.dynamodb.transaction_table_name
  card_error_table_name   = module.dynamodb.card_error_table_name
  notification_table_name = module.dynamodb.notification_table_name
  notification_error_table_name = module.dynamodb.notification_error_table_name

  # S3 buckets
  avatars_bucket_name   = module.s3.avatars_bucket_name
  reports_bucket_name   = module.s3.reports_bucket_name
  templates_bucket_name = module.s3.templates_bucket_name

  # SQS queues
  create_request_card_queue_url  = module.sqs.create_request_card_queue_url
  notification_email_queue_url   = module.sqs.notification_email_queue_url
  create_request_card_queue_arn  = module.sqs.create_request_card_arn
  notification_email_queue_arn   = module.sqs.notification_email_arn

  # Secrets
  jwt_secret_arn      = module.secrets.jwt_secret_arn
  password_secret_arn = module.secrets.password_secret_arn
  cvv_unlock_jwt_secret = var.cvv_unlock_jwt_secret

  tags = local.common_tags
}

# API Gateway
module "apigw" {
  source = "./modules/apigw"
  env    = var.env

  # Lambda functions
  register_user_invoke_arn           = module.lambda.register_user_invoke_arn
  login_user_invoke_arn              = module.lambda.login_user_invoke_arn
  update_user_invoke_arn             = module.lambda.update_user_invoke_arn
  upload_avatar_user_invoke_arn      = module.lambda.upload_avatar_user_invoke_arn
  get_profile_user_invoke_arn        = module.lambda.get_profile_user_invoke_arn
  card_activate_invoke_arn           = module.lambda.card_activate_invoke_arn
  card_purchase_invoke_arn           = module.lambda.card_purchase_invoke_arn
  card_transaction_save_invoke_arn   = module.lambda.card_transaction_save_invoke_arn
  card_paid_credit_card_invoke_arn   = module.lambda.card_paid_credit_card_invoke_arn
  card_get_report_invoke_arn         = module.lambda.card_get_report_invoke_arn
  card_get_invoke_arn                = module.lambda.card_get_invoke_arn
  card_get_by_user_invoke_arn        = module.lambda.card_get_by_user_invoke_arn
  security_pin_set_invoke_arn        = module.lambda.security_pin_set_invoke_arn
  security_pin_verify_cvv_invoke_arn = module.lambda.security_pin_verify_cvv_invoke_arn
  card_get_by_number_invoke_arn = module.lambda.card_get_by_number_invoke_arn


  # Lambda function names
  register_user_function_name           = module.lambda.register_user_function_name
  login_user_function_name              = module.lambda.login_user_function_name
  update_user_function_name             = module.lambda.update_user_function_name
  upload_avatar_user_function_name      = module.lambda.upload_avatar_user_function_name
  get_profile_user_function_name        = module.lambda.get_profile_user_function_name
  card_activate_function_name           = module.lambda.card_activate_function_name
  card_purchase_function_name           = module.lambda.card_purchase_function_name
  card_transaction_save_function_name   = module.lambda.card_transaction_save_function_name
  card_paid_credit_card_function_name   = module.lambda.card_paid_credit_card_function_name
  card_get_report_function_name         = module.lambda.card_get_report_function_name
  card_get_function_name                = module.lambda.card_get_function_name
  card_get_by_user_function_name        = module.lambda.card_get_by_user_function_name
  security_pin_set_function_name        = module.lambda.security_pin_set_function_name
  security_pin_verify_cvv_function_name = module.lambda.security_pin_verify_cvv_function_name
  card_get_by_number_function_name = module.lambda.card_get_by_number_function_name

  tags = local.common_tags
}
