# Internet VPC
resource "aws_vpc" "main" {
  count = length(var.environment)
  cidr_block           = "10.0.0.0/16"
  instance_tenancy     = "default"
  enable_dns_support   = "true"
  enable_dns_hostnames = "true"
  enable_classiclink   = "false"
  tags = {
    Name = "${var.environment[count.index]}-${var.prefix}-main-VPC"
  }
}

# Subnets
resource "aws_subnet" "main-public-1" {
  count = length(var.environment)
  vpc_id                  = aws_vpc.main[count.index].id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = "true"
  availability_zone       = "us-east-1a"

  tags = {
    Name = "${var.environment[count.index]}-${var.prefix}-main-public-1"
  }
}

resource "aws_subnet" "main-public-2" {
  count = length(var.environment)
  vpc_id                  = aws_vpc.main[count.index].id
  cidr_block              = "10.0.2.0/24"
  map_public_ip_on_launch = "true"
  availability_zone       = "us-east-1b"

  tags = {
    Name = "${var.environment[count.index]}-${var.prefix}-main-public-2"
  }
}

resource "aws_subnet" "main-public-3" {
  count = length(var.environment)
  vpc_id                  = aws_vpc.main[count.index].id
  cidr_block              = "10.0.3.0/24"
  map_public_ip_on_launch = "true"
  availability_zone       = "us-east-1c"

  tags = {
    Name = "${var.environment[count.index]}-${var.prefix}-main-public-3"
  }
}

resource "aws_subnet" "main-private-1" {
  count = length(var.environment)
  vpc_id                  = aws_vpc.main[count.index].id
  cidr_block              = "10.0.4.0/24"
  map_public_ip_on_launch = "false"
  availability_zone       = "us-east-1a"

  tags = {
    Name = "${var.environment[count.index]}-${var.prefix}-main-private-1"
  }
}

resource "aws_subnet" "main-private-2" {
  count = length(var.environment)
  vpc_id                  = aws_vpc.main[count.index].id
  cidr_block              = "10.0.5.0/24"
  map_public_ip_on_launch = "false"
  availability_zone       = "us-east-1b"

  tags = {
    Name = "${var.environment[count.index]}-${var.prefix}-main-private-2"
  }
}

resource "aws_subnet" "main-private-3" {
  count = length(var.environment)
  vpc_id                  = aws_vpc.main[count.index].id
  cidr_block              = "10.0.6.0/24"
  map_public_ip_on_launch = "false"
  availability_zone       = "us-east-1c"

  tags = {
    Name = "${var.environment[count.index]}-${var.prefix}-main-private-3"
  }
}

# Internet GW
resource "aws_internet_gateway" "main-gw" {
  count = length(var.environment)
  vpc_id = aws_vpc.main[count.index].id

  tags = {
    Name = "main"
  }
}

# route tables
resource "aws_route_table" "main-public" {
  count = length(var.environment)
  vpc_id = aws_vpc.main[count.index].id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main-gw[count.index].id
  }
}

# route associations public
resource "aws_route_table_association" "main-public-1-a" {
  count = length(var.environment)
  subnet_id      = aws_subnet.main-public-1[count.index].id
  route_table_id = aws_route_table.main-public[count.index].id
}

resource "aws_route_table_association" "main-public-2-a" {
  count = length(var.environment)
  subnet_id      = aws_subnet.main-public-2[count.index].id
  route_table_id = aws_route_table.main-public[count.index].id
}

resource "aws_route_table_association" "main-public-3-a" {
  count = length(var.environment)
  subnet_id      = aws_subnet.main-public-3[count.index].id
  route_table_id = aws_route_table.main-public[count.index].id
}

resource "aws_route_table" "main-private" {
  count = length(var.environment)
  vpc_id = aws_vpc.main[count.index].id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat-gw[count.index].id
  }
}

# route associations private
resource "aws_route_table_association" "main-private-1-a" {
  count = length(var.environment)
  subnet_id      = aws_subnet.main-private-1[count.index].id
  route_table_id = aws_route_table.main-private[count.index].id
}

resource "aws_route_table_association" "main-private-2-a" {
  count = length(var.environment)
  subnet_id      = aws_subnet.main-private-2[count.index].id
  route_table_id = aws_route_table.main-private[count.index].id
}

resource "aws_route_table_association" "main-private-3-a" {
  count = length(var.environment)
  subnet_id      = aws_subnet.main-private-3[count.index].id
  route_table_id = aws_route_table.main-private[count.index].id
}

# nat gw
resource "aws_eip" "nat" {
  count = length(var.environment)
  vpc = true
}

resource "aws_nat_gateway" "nat-gw" {
  count = length(var.environment)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.main-public-1[count.index].id
  depends_on    = [aws_internet_gateway.main-gw]
}

