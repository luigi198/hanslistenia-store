# Product photos: public read for the catalog. Only the products/ prefix is
# public; uploads go through presigned URLs issued to the admin.

locals {
  product_images_prefix = "products/" # must match PRODUCT_IMAGE_PREFIX in the app
}

resource "aws_s3_bucket" "products" {
  bucket = "hanslistenia-products-${var.account_id}"
}

resource "aws_s3_bucket_public_access_block" "products" {
  bucket                  = aws_s3_bucket.products.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false # the read-only policy below is public on purpose
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "products" {
  bucket = aws_s3_bucket.products.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "products" {
  bucket = aws_s3_bucket.products.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "products" {
  bucket = aws_s3_bucket.products.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadProductImages"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.products.arn}/${local.product_images_prefix}*"
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [aws_s3_bucket.products.arn, "${aws_s3_bucket.products.arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.products]
}

resource "aws_s3_bucket_cors_configuration" "products" {
  bucket = aws_s3_bucket.products.id
  cors_rule {
    allowed_methods = ["PUT"] # admin photo uploads from the browser
    allowed_origins = var.upload_origins
    allowed_headers = ["content-type"]
    max_age_seconds = 3600
  }
}
