# Values for .env.local and Vercel's environment variables.

output "S3_RECEIPTS_BUCKET" {
  value = aws_s3_bucket.receipts.bucket
}

output "S3_PRODUCTS_BUCKET" {
  value = aws_s3_bucket.products.bucket
}

output "S3_PRODUCTS_PUBLIC_URL" {
  value = "https://${aws_s3_bucket.products.bucket_regional_domain_name}"
}

output "AWS_REGION" {
  value = var.region
}

output "AWS_ACCESS_KEY_ID" {
  value = aws_iam_access_key.app.id
}

# Hidden in plan/apply output; read it with: terraform output -raw AWS_SECRET_ACCESS_KEY
output "AWS_SECRET_ACCESS_KEY" {
  value     = aws_iam_access_key.app.secret
  sensitive = true
}
