resource "aws_vpc" "payment_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-vpc-${var.environment}"
  })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.payment_vpc.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-igw-${var.environment}"
  })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.payment_vpc.id
  cidr_block              = var.public_subnet_cidr
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-public-subnet-${var.environment}"
  })
}

resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.payment_vpc.id
  cidr_block = var.private_subnet_cidr

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-private-subnet-${var.environment}"
  })
}

resource "aws_eip" "nat_eip" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-nat-eip-${var.environment}"
  })
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-nat-${var.environment}"
  })
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.payment_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-public-rt-${var.environment}"
  })
}

resource "aws_route_table_association" "public_assoc" {
  route_table_id = aws_route_table.public_rt.id
  subnet_id      = aws_subnet.public.id
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.payment_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-private-rt-${var.environment}"
  })
}

resource "aws_route_table_association" "private_assoc" {
  route_table_id = aws_route_table.private_rt.id
  subnet_id      = aws_subnet.private.id
}

# SG para Lambdas
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-payment-lambda-sg-${var.environment}"
  description = "Security group para Lambdas del payment system"
  vpc_id      = aws_vpc.payment_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-lambda-sg-${var.environment}"
  })
}

# SG para Redis (solo acceso desde Lambdas)
resource "aws_security_group" "redis_sg" {
  name        = "${var.project_name}-payment-redis-sg-${var.environment}"
  description = "Security group para Redis"
  vpc_id      = aws_vpc.payment_vpc.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-payment-redis-sg-${var.environment}"
  })
}
