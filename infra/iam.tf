# The app's identity (Vercel + local dev). Least privilege: object
# read/write/delete in the two buckets, nothing else.

resource "aws_iam_user" "app" {
  name = "hanslistenia-app"
}

data "aws_iam_policy_document" "app_storage" {
  statement {
    sid       = "Receipts"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.receipts.arn}/*"]
  }

  statement {
    sid       = "ProductImages"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.products.arn}/${local.product_images_prefix}*"]
  }
}

resource "aws_iam_user_policy" "app_storage" {
  name   = "storage-access"
  user   = aws_iam_user.app.name
  policy = data.aws_iam_policy_document.app_storage.json
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}
