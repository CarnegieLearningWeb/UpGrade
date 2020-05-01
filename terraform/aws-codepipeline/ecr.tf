resource "aws_ecr_repository" "ecr_repo_name" {
  count = length(var.environment)
  name = "${var.environment[count.index]}-${var.prefix}-backend"
}