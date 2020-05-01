resource "aws_codebuild_project" "prod_app_build" {
  count = length(var.environment)
  name          = "${var.environment[count.index]}-${var.prefix}-codebuild"
  build_timeout = "80"
  service_role = aws_iam_role.codebuild_role[count.index].arn

  depends_on = [aws_s3_bucket.bucket_site, aws_s3_bucket.source]

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"

    // https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-available.html
    image           = "aws/codebuild/standard:2.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "stage"
      value = var.repository_branch[count.index]
    }
    environment_variable {
      name  = "distribuition_id"
      value = aws_cloudfront_distribution.site_s3_distribution[count.index].id
    }
    environment_variable {
      name  = "bucket_name"
      value = aws_s3_bucket.bucket_site[count.index].bucket
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }

}