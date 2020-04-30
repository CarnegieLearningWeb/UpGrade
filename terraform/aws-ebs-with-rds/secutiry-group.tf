resource "aws_security_group" "app-prod" {
  count       = length(var.environment)
  vpc_id      = aws_vpc.main[count.index].id
  name        = "${var.environment[count.index]}-${var.prefix}-schedular-security group"
  description = "${var.environment[count.index]}-${var.prefix}-security group for for the app"
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
  count       = length(var.environment)
  vpc_id      = aws_vpc.main[count.index].id
  name        = "${var.environment[count.index]}-${var.prefix}-allow-rds"
  description = "${var.environment[count.index]}-${var.prefix}-allow-rds"
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app-prod[count.index].id] # allowing access from our instance
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

