terraform {
  required_version = ">= 1.5.0"
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
  }
}

locals {
  infra = yamldecode(file(abspath("${path.module}/../../render.yaml")))
  service = local.infra.services[0]
}

provider "render" {
  api_key = var.render_api_key
}

resource "render_web_service" "app" {
  name           = var.service_name != "" ? var.service_name : local.service.name
  repo           = var.repo
  branch         = var.branch
  env            = var.runtime
  plan           = var.plan
  build_command  = var.build_command != "" ? var.build_command : local.service.buildCommand
  start_command  = var.start_command != "" ? var.start_command : local.service.startCommand
  auto_deploy    = var.auto_deploy
}

output "service_name" {
  value = render_web_service.app.name
}
