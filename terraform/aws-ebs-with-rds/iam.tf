
# ---------------------------------------------------------------------------------------------------------------------
# IAM ROLE OF EC2 INSTANCE FOR BEANSTACK APPLICATION
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_iam_instance_profile" "app-ec2-role" {
  count = length(var.environment)
  name = "${var.environment[count.index]}-${var.prefix}-app-instance-profile"
  role = aws_iam_role.app-ec2-role[count.index].name
}

resource "aws_iam_role" "app-ec2-role" {
  count = length(var.environment)
  name               = "${var.environment[count.index]}-${var.prefix}-app-ec2-role"
  force_detach_policies = true
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# ---------------------------------------------------------------------------------------------------------------------
# ELASTIC BEANSTACK SERVICE ROLE
# ---------------------------------------------------------------------------------------------------------------------

# service
resource "aws_iam_role" "elasticbeanstalk-service-role" {
  count = length(var.environment)
  name               = "${var.environment[count.index]}-${var.prefix}-elasticbeanstalk-service-role"
  force_detach_policies = true
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "elasticbeanstalk.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

}

# policies
resource "aws_iam_policy_attachment" "app-attach1" {
  count = length(var.environment)
  name       = "app-attach1"
  roles      = [aws_iam_role.app-ec2-role[count.index].name]
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_policy_attachment" "app-attach2" {
  count = length(var.environment)
  name       = "app-attach2"
  roles      = [aws_iam_role.app-ec2-role[count.index].name]
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
}

resource "aws_iam_policy_attachment" "app-attach3" {
  count = length(var.environment)
  name       = "app-attach3"
  roles      = [aws_iam_role.app-ec2-role[count.index].name]
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}
resource "aws_iam_policy_attachment" "app-attach4" {
  count = length(var.environment)
  name       = "app-attach4"
  roles      = [aws_iam_role.app-ec2-role[count.index].name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
resource "aws_iam_policy_attachment" "app-attach5" {
  count = length(var.environment)
  name       = "app-attach5"
  roles      = [aws_iam_role.app-ec2-role[count.index].name]
  policy_arn = "arn:aws:iam::aws:policy/AWSStepFunctionsFullAccess"
}
resource "aws_iam_policy_attachment" "app-attach6" {
  count = length(var.environment)
  name       = "app-attach6"
  roles      = [aws_iam_role.app-ec2-role[count.index].name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_policy_attachment" "app-attach7" {
  count = length(var.environment)
  name       = "app-attach7"
  roles      = [aws_iam_role.elasticbeanstalk-service-role[count.index].name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}
resource "aws_iam_policy_attachment" "app-attach8" {
  count = length(var.environment)
  name       = "app-attach8"
  roles      = [aws_iam_role.elasticbeanstalk-service-role[count.index].name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
