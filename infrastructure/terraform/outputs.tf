output "vpc_id" {
  value       = aws_vpc.sbmi_vpc.id
  description = "Unique Identifier of the provisioned AWS Virtual Private Cloud"
}

output "public_ip" {
  value       = aws_instance.app_server.public_ip
  description = "Staging VM External IP address"
}

output "connection_endpoint" {
  value       = "http://${aws_instance.app_server.public_ip}:5000"
  description = "Dynamic staging server API connection url"
}
