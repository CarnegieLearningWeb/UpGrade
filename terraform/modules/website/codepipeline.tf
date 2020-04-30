resource "aws_codepipeline" "prod_pipeline" {
  count = length(var.environment)
  name     = "${var.environment[count.index]}-${var.prefix}-pipeline"
  role_arn = aws_iam_role.codepipeline_role[count.index].arn

  depends_on = [aws_s3_bucket.bucket_site, aws_s3_bucket.source]
  
  artifact_store {
    location = aws_s3_bucket.source[count.index].bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["${var.environment[count.index]}-${var.prefix}-frontend-source"]

      configuration = {
        RepositoryName = aws_codecommit_repository.code_repo.repository_name
        BranchName     = var.repository_branch[count.index]
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
      version          = "1"
      input_artifacts  = ["${var.environment[count.index]}-${var.prefix}-frontend-source"]

      configuration = {
        ProjectName = aws_codebuild_project.prod_app_build[count.index].name
      }
    }
  }
}
