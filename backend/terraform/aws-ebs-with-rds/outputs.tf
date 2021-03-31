output "ebs-cname" {
  value = aws_elastic_beanstalk_environment.upgrade-app-prod.cname
}

output "ebs-env" {
  value = aws_elastic_beanstalk_environment.upgrade-app-prod.name
}

output "application" {
  value = aws_elastic_beanstalk_environment.upgrade-app-prod.application
}

