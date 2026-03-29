terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

locals {
  infra = yamldecode(file(abspath("${path.module}/../../gcp.yaml")))
}

provider "google" {
  project = local.infra["Project ID"]
  region  = local.infra["Region"]
}

resource "google_artifact_registry_repository" "app" {
  location      = local.infra["Region"]
  repository_id = var.repository_id
  format        = "DOCKER"
  description   = "BattleTris Cloud Run images"
}

resource "google_cloud_run_v2_service" "app" {
  name     = var.service_name
  location = local.infra["Region"]

  template {
    containers {
      image = var.image_uri
      ports {
        container_port = var.container_port
      }
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

output "service_url" {
  value = google_cloud_run_v2_service.app.uri
}

output "artifact_registry_repo" {
  value = google_artifact_registry_repository.app.id
}

output "project_id" {
  value = local.infra["Project ID"]
}

output "region" {
  value = local.infra["Region"]
}

output "target_architecture" {
  value = local.infra["Target Architecture"]
}
