terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  infra = yamldecode(file(abspath("${path.module}/../../aws-dev.yaml")))
  service_name = var.service_name != "" ? var.service_name : local.infra["WebService"]
  ecr_name     = var.ecr_repository_name != "" ? var.ecr_repository_name : local.infra["WebService"]
  app_image    = try(local.infra["Application Image"], local.ecr_name)
  account_id   = try(local.infra["AccountID"], "")
  image_tag    = try(local.infra["Tag"], "latest")
  image_identifier = var.image_identifier != "" ? var.image_identifier : "${local.account_id}.dkr.ecr.${local.infra["Region"]}.amazonaws.com/${local.app_image}:${local.image_tag}"
}

provider "aws" {
  region = local.infra["Region"]
}

resource "aws_ecr_repository" "app" {
  name                 = local.ecr_name
  image_tag_mutability = "MUTABLE"
  force_delete         = false
}

resource "aws_iam_role" "apprunner_access" {
  name               = "${local.service_name}-apprunner-access"
  assume_role_policy = data.aws_iam_policy_document.apprunner_assume.json
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_access" {
  role       = aws_iam_role.apprunner_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

data "aws_iam_policy_document" "apprunner_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com", "tasks.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_apprunner_service" "app" {
  service_name = local.service_name

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access.arn
    }

    image_repository {
      image_identifier      = local.image_identifier
      image_repository_type = "ECR"

      image_configuration {
        port = var.container_port
      }
    }

    auto_deployments_enabled = true
  }

  health_check_configuration {
    protocol            = "TCP"
    healthy_threshold   = 1
    unhealthy_threshold = 5
    interval            = 10
    timeout             = 5
  }

  instance_configuration {
    cpu    = var.instance_cpu
    memory = var.instance_memory
  }
}

output "service_url" {
  value = aws_apprunner_service.app.service_url
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "region" {
  value = local.infra["Region"]
}

output "target_architecture" {
  value = local.infra["Target Architecture"]
}
