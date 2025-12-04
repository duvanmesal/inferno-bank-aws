output "avatars_bucket_name" {
  value = aws_s3_bucket.avatars.id
}

output "avatars_bucket_arn" {
  value = aws_s3_bucket.avatars.arn
}

output "reports_bucket_name" {
  value = aws_s3_bucket.reports.id
}

output "reports_bucket_arn" {
  value = aws_s3_bucket.reports.arn
}

output "templates_bucket_name" {
  value = aws_s3_bucket.templates.id
}

output "templates_bucket_arn" {
  value = aws_s3_bucket.templates.arn
}
