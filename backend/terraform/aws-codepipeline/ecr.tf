resource "aws_ecr_repository" "ecr_repo_name" {
  
  name = "${var.environment}-${var.prefix}-backend"
}