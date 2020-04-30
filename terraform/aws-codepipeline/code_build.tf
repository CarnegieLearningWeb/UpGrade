
resource "aws_codebuild_project" "backend_code_build" {
  count = length(var.environment)
  name           = "${var.environment[count.index]}-${var.prefix}-backend-docker-build"
  description    = "${var.environment[count.index]}-${var.prefix}-backend docker build"
  build_timeout  = "30"
  service_role   = aws_iam_role.iam_code_codebuild[count.index].arn
  encryption_key = aws_kms_alias.artifacts[count.index].arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = var.build_compute_type
    image           = var.build_image
    type            = "LINUX_CONTAINER"
    privileged_mode = var.privileged_mode

  environment_variable {
      name  = "ENVIRONMENT"
      value = var.environment[count.index]
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }
    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }
    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = aws_ecr_repository.ecr_repo_name[count.index].name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }

}

