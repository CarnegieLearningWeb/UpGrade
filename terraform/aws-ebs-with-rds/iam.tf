
# ---------------------------------------------------------------------------------------------------------------------
# IAM ROLE OF EC2 INSTANCE FOR BEANSTACK APPLICATION
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_iam_instance_profile" "app-ec2-role" {
  
  name = "${var.environment}-${var.prefix}-app-instance-profile"
  role = aws_iam_role.app-ec2-role.name
}

resource "aws_iam_role" "app-ec2-role" {
  
  name               = "${var.environment}-${var.prefix}-app-ec2-role"
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
  
  name               = "${var.environment}-${var.prefix}-elasticbeanstalk-service-role"
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
# policies
resource "aws_iam_role_policy_attachment" "app-attach1" {
  role     = aws_iam_role.app-ec2-role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "app-attach2" {
  role      = aws_iam_role.app-ec2-role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
}

resource "aws_iam_role_policy_attachment" "app-attach3" {
  role      = aws_iam_role.app-ec2-role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}
resource "aws_iam_role_policy_attachment" "app-attach4" {
  role = aws_iam_role.app-ec2-role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "app-attach5" {
  role = aws_iam_role.elasticbeanstalk-service-role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "app-attach6" {
  role     = aws_iam_role.app-ec2-role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "app-attach7" {
  role      = aws_iam_role.elasticbeanstalk-service-role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}

resource "aws_iam_role_policy_attachment" "app-attach8" {
  role     = aws_iam_role.app-ec2-role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSStepFunctionsFullAccess"
}
resource "aws_iam_role_policy_attachment" "app-attach9" {
  role      = aws_iam_role.elasticbeanstalk-service-role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSStepFunctionsFullAccess"
}