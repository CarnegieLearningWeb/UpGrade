
resource "aws_codebuild_project" "backend_code_build" {
  name           = "${var.environment}-${var.prefix}-backend-docker-build"
  description    = "${var.environment}-${var.prefix}-backend docker build"
  build_timeout  = "30"
  service_role   = aws_iam_role.iam_code_codebuild.arn
  encryption_key = aws_kms_alias.artifacts.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_LARGE"
    image           = "aws/codebuild/standard:1.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

  environment_variable {
      name  = "ENVIRONMENT"
      value = var.environment
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.AWS_REGION
    }
    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }
    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = aws_ecr_repository.ecr_repo_name.name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }

}

