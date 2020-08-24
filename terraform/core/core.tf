provider aws {
    region = "us-east-1"
}

# resource "aws_codecommit_repository" "code_repo" {
#   repository_name = var.repository_name
# }

resource "aws_elastic_beanstalk_application" "upgrade-app" {
  name        = var.ebs_app_name
  description = "Beanstalk application"
}
output "name" {
  value       = aws_elastic_beanstalk_application.upgrade-app.name
}