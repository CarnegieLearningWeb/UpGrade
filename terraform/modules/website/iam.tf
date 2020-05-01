resource "aws_iam_role" "codepipeline_role" {
  count = length(var.environment)
  name               = "codepipeline-${var.environment[count.index]}-${var.prefix}-${var.repository_branch[count.index]}-role"
  assume_role_policy = file("${path.module}/templates/policies/codepipeline_role.json")
}

data "template_file" "codepipeline_policy" {
  count = length(var.environment)
  template = "${file("${path.module}/templates/policies/codepipeline.json")}"

  vars = {
    aws_s3_bucket_arn = "${aws_s3_bucket.source[count.index].arn}"
  }
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  count = length(var.environment)
  name   = "codepipeline_policy"
  role   = aws_iam_role.codepipeline_role[count.index].id
  policy = data.template_file.codepipeline_policy[count.index].rendered
}

resource "aws_iam_role" "codebuild_role" {
  count = length(var.environment)
  name               = "codebuild-${var.environment[count.index]}-${var.prefix}-${var.repository_branch[count.index]}-role"
  assume_role_policy = file("${path.module}/templates/policies/codebuild_role.json")
}

data "template_file" "codebuild_policy" {
  count = length(var.environment)
  template = file("${path.module}/templates/policies/codebuild.json")

  vars = {
    aws_s3_bucket_arn = aws_s3_bucket.source[count.index].arn
  }
}

resource "aws_iam_role_policy" "codebuild_policy" {
  count = length(var.environment)
  name   = "codebuild-${var.environment[count.index]}-${var.prefix}-${var.repository_branch[count.index]}-policy"
  role   = aws_iam_role.codebuild_role[count.index].id
  policy = data.template_file.codebuild_policy[count.index].rendered
}
