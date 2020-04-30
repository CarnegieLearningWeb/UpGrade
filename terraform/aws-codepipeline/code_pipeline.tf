
data "aws_availability_zones" "available" {}

data "aws_caller_identity" "current" {}

resource "aws_codepipeline" "codepipeline" {
  count = length(var.environment)
  name     = "${var.environment[count.index]}-${var.prefix}-backend-pipeline"
  role_arn = aws_iam_role.iam_code_pipeline[count.index].arn

  artifact_store {
    location = aws_s3_bucket.artifacts[count.index].bucket
    type     = "S3"
    encryption_key {
      id   = aws_kms_alias.artifacts[count.index].arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["${var.environment[count.index]}-${var.prefix}-backend-docker-source"]

      configuration = {
        RepositoryName = aws_codecommit_repository.code_repo.repository_name
        BranchName     = var.branch_name[count.index]
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["${var.environment[count.index]}-${var.prefix}-backend-docker-source"]
      output_artifacts = ["${var.environment[count.index]}-${var.prefix}-backend-docker-build"]
      version          = 1

      configuration = {
        ProjectName = aws_codebuild_project.backend_code_build[count.index].name
      }
    }
  }
  stage {
    name = "Deploy"
    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ElasticBeanstalk"
      input_artifacts = ["${var.environment[count.index]}-${var.prefix}-backend-docker-build"]
      version         = "1"

      configuration = {
        ApplicationName = var.ebs_app_name[count.index]
        EnvironmentName =  var.ebs_env_name[count.index]
      }
    }
  }
}


