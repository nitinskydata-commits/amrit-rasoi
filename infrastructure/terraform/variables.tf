variable "aws_region" {
  type        = string
  default     = "ap-south-1"
  description = "Target deployment region (e.g. Mumbai)"
}

variable "instance_type" {
  type        = string
  default     = "t3.medium"
  description = "Amazon EC2 size profile"
}

variable "ami_id" {
  type        = string
  default     = "ami-03f4878755434977f" # Canonical Ubuntu Server 22.04 LTS
  description = "AWS EC2 Operating System Image reference"
}

variable "key_name" {
  type        = string
  default     = "sbmi-staging-key"
  description = "Name of keypair for secure Shell SSH logging"
}
