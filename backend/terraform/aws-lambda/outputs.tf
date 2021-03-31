output "lambda-arn" {
  value = "${aws_lambda_function.lambda_function.*.arn}"
}
