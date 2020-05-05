
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
resource "aws_iam_policy_attachment" "app-attach1" {
  
  name       = "app-attach1"
  roles      = [aws_iam_role.app-ec2-role.name]
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_policy_attachment" "app-attach2" {
  
  name       = "app-attach2"
  roles      = [aws_iam_role.app-ec2-role.name]
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
}

resource "aws_iam_policy_attachment" "app-attach3" {
  
  name       = "app-attach3"
  roles      = [aws_iam_role.app-ec2-role.name]
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}
resource "aws_iam_policy_attachment" "app-attach4" {
  
  name       = "app-attach4"
  roles = [
    "${aws_iam_role.app-ec2-role.name}",
    "${aws_iam_role.elasticbeanstalk-service-role.name}"
  ]
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
resource "aws_iam_policy_attachment" "app-attach5" {
  
  name       = "app-attach5"
  roles      = [aws_iam_role.app-ec2-role.name]
  policy_arn = "arn:aws:iam::aws:policy/AWSStepFunctionsFullAccess"
}
resource "aws_iam_policy_attachment" "app-attach6" {
  
  name       = "app-attach6"
  roles      = [aws_iam_role.app-ec2-role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_policy_attachment" "app-attach7" {
  
  name       = "app-attach7"
  roles      = [aws_iam_role.elasticbeanstalk-service-role.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}