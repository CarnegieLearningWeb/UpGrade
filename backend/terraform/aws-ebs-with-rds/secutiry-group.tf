resource "aws_security_group" "app-prod" {
  
  vpc_id      = aws_vpc.main.id
  name        = "${var.environment}-${var.prefix}-scheduler-security group"
  description = "${var.environment}-${var.prefix}-security group for for the app"
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "allow-rds" {
  
  vpc_id      = aws_vpc.main.id
  name        = "${var.environment}-${var.prefix}-allow-rds"
  description = "${var.environment}-${var.prefix}-allow-rds"
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app-prod.id] # allowing access from our instance
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    self        = true
  }
  lifecycle {
    create_before_destroy = true
  }
}

