resource "aws_s3_bucket" "catalog" {
  bucket = var.catalog_bucket_name != "" ? var.catalog_bucket_name : "${var.project_name}-catalog-${var.environment}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-catalog-${var.environment}"
  })
}

resource "aws_s3_bucket_versioning" "catalog_versioning" {
  bucket = aws_s3_bucket.catalog.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "catalog_sse" {
  bucket = aws_s3_bucket.catalog.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
