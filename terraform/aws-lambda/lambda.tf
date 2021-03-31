# ---------------------------------------------------------------------------------------------------------------------
# RUN NODE SCRIPT TO COMPILE AND COMPRESS LAMBDA
# ---------------------------------------------------------------------------------------------------------------------

#data "external" "compile_compress_lambda" {
#  program = ["node", "../../aws-lambda/build.js"]
#  query = {
#    lambda_zip  = "${var.lambda_zip}-${var.app_version}"
#    lambda_path = "${var.lambda_path}"
#    output_path = "${var.output_path}/"
#  }
#}
#
#data "null_data_source" "lambda_zip_source" {
#  depends_on = [data.external.compile_compress_lambda]
#  inputs = {
#    output_path = "${data.external.compile_compress_lambda.result["output_path"]}${var.lambda_zip}-${var.app_version}"
#  }
#}
# ---------------------------------------------------------------------------------------------------------------------
# CREATE S3 AND UPLOAD COMPRESSED LAMBDA ZIP
# ---------------------------------------------------------------------------------------------------------------------

# resource "aws_s3_bucket" "bucket" {
#   bucket = "${var.environment}-${var.prefix}-${var.s3_bucket}"
# }


# resource "aws_s3_bucket_object" "file_upload" {
#   bucket = aws_s3_bucket.bucket.id
#   key    = "${var.lambda_zip}-${var.app_version}"
#   source = data.null_data_source.lambda_zip_source.outputs.output_path
# }


# ---------------------------------------------------------------------------------------------------------------------
# CREATE RESOURCE AWS LAMBDA FUNCTION
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_lambda_function" "lambda_function" {
  #count = data.external.compile_compress_lambda.result["error"] == "0" ? 1: 0
  #source_code_hash = base64sha256(filebase64(data.null_data_source.lambda_zip_source.outputs["output_path"]))
  function_name    = "${var.environment}-${var.prefix}-${var.function_name}"
  #filename         = data.null_data_source.lambda_zip_source.outputs["output_path"]
  s3_bucket        = var.s3_lambda_bucket
  s3_key           = var.s3_lambda_key
  handler = var.function_handler
  runtime = var.runtime
  role    = aws_iam_role.iam_for_lambda.arn

  environment {
    variables = {
      TOKEN_SECRET_KEY = var.TOKEN_SECRET_KEY
    }
  }
}

