resource "aws_lb" "main" {
  name               = "${var.prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.subnet_ids
  
  enable_deletion_protection = var.enable_deletion_protection
  
  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-alb"
    }
  )
}

resource "aws_lb_target_group" "main" {
  name        = "${var.prefix}-tg"
  port        = var.target_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = var.health_check_path
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 6
    protocol            = "HTTP"
    matcher             = "200"
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-tg"
    }
  )
}

resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  tags = var.tags
  
  options {
    certificate_transparency_logging_preference = "ENABLED"
  }

  key_algorithm = "EC_prime256v1"
  
  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

locals {
  domain_parts = split(".", var.domain_name)
}
data "aws_route53_zone" "main" {
  name = join(".", slice(local.domain_parts, length(local.domain_parts) - 2, length(local.domain_parts) ))
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  depends_on = [aws_acm_certificate_validation.main]
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id               = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
