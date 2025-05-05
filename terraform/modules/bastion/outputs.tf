output "bastion_id" {
  description = "The ID of the bastion host"
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "The public IP address of the bastion host"
  value       = aws_instance.bastion.public_ip
}

output "bastion_security_group_id" {
  description = "The ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

output "ssh_key_name" {
  description = "The name of the SSH key pair used for the bastion"
  value       = aws_key_pair.bastion.key_name
}

output "private_key_path" {
  description = "The local path where the private key is stored"
  value       = local_file.private_key.filename
}
