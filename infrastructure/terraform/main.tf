provider "aws" {
  region = var.aws_region
}

# 🌐 Virtual Private Cloud
resource "aws_vpc" "sbmi_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "sbmi-ecommerce-vpc"
  }
}

# 🕸️ Subnets
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.sbmi_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags = {
    Name = "sbmi-public-subnet"
  }
}

resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.sbmi_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  tags = {
    Name = "sbmi-private-subnet"
  }
}

# 🎛️ Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.sbmi_vpc.id
  tags = {
    Name = "sbmi-igw"
  }
}

# 🗺️ Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.sbmi_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "sbmi-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# 🛡️ Security Group for Application Gateway & APIs
resource "aws_security_group" "app_sg" {
  name        = "sbmi-app-sg"
  description = "Allow HTTP/HTTPS traffic"
  vpc_id      = aws_vpc.sbmi_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Limit to authorized IPs in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ⚙️ EC2 Instance for Server & Gateways (Staging VM)
resource "aws_instance" "app_server" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public_subnet.id
  vpc_security_group_ids = [
    aws_security_group.app_sg.id
  ]
  key_name = var.key_name

  tags = {
    Name = "sbmi-app-server"
  }
}
