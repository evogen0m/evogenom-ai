variable "prefix" {
  description = "Prefix for all resources"
  type        = string
}

variable "vpc_id" {
  description = "The VPC ID where the bastion will be created"
  type        = string
}

variable "subnet_id" {
  description = "The subnet ID where the bastion will be created"
  type        = string
}

variable "instance_type" {
  description = "The instance type for the bastion host"
  type        = string
  default     = "t4g.nano"
}

variable "rds_security_group_id" {
  description = "The security group ID of the RDS instance"
  type        = string
}

variable "allowed_ssh_cidrs" {
  description = "List of CIDR blocks allowed to SSH to the bastion"
  type        = list(string)
  default     = ["91.155.202.77/32"]
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}
