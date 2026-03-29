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
  infra = yamldecode(file(abspath("${path.module}/../../render-dev.yaml")))
  region = coalesce(try(local.infra["Region"], ""), var.region)
}

provider "render" {
  api_key = var.render_api_key
  owner_id = local.infra["Render OwnerID"]
}

resource "render_web_service" "app" {
  name   = local.infra["WebService"]
  plan   = var.plan
  region = local.region

  runtime_source = {
    native_runtime = {
      repo_url      = local.infra["Repository"]
      branch        = var.branch
      runtime       = var.runtime
      build_command = var.build_command
      auto_deploy   = var.auto_deploy
    }
  }

  start_command = var.start_command
}

output "service_name" {
  value = render_web_service.app.name
}
