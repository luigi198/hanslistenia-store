variable "account_id" {
  description = "The hanslistenia AWS account. Terraform refuses to touch any other."
  type        = string
  default     = "695646786339"
}

variable "aws_profile" {
  description = "Local AWS CLI profile (IAM Identity Center) for that account."
  type        = string
  default     = "hanslistenia"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "upload_origins" {
  description = <<-EOT
    Sites allowed to upload from the browser with presigned URLs (CORS).
    Add the Vercel URL (e.g. https://hanslistenia.vercel.app) once it exists.
  EOT
  type        = list(string)
  default = [
    "https://hanslistenia.com",
    "https://www.hanslistenia.com",
    "http://localhost:3000",
  ]
}
