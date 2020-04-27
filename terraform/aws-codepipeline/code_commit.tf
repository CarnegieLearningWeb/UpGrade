resource "aws_codecommit_repository" "code_repo" {
  repository_name = var.repository_name
}
