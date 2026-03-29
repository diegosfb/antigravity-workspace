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
  service_name = var.service_name != "" ? var.service_name : local.infra["WebService"]
  repo_id      = var.repository_id != "" ? var.repository_id : local.infra["Artifact Registry Repo"]
  app_image    = try(local.infra["Application Image"], local.service_name)
  image_tag    = try(local.infra["Tag"], "latest")
  image_uri    = var.image_uri != "" ? var.image_uri : "${local.infra["Region"]}-docker.pkg.dev/${local.infra["GCP ProjectID"]}/${local.repo_id}/${local.app_image}:${local.image_tag}"
}

provider "google" {
  project = local.infra["GCP ProjectID"]
  region  = local.infra["Region"]
}

resource "google_artifact_registry_repository" "app" {
  location      = local.infra["Region"]
  repository_id = local.repo_id
  format        = "DOCKER"
  description   = "BattleTris Cloud Run images"
}

resource "google_cloud_run_v2_service" "app" {
  name     = local.service_name
  location = local.infra["Region"]

  template {
    containers {
      image = local.image_uri
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
  value = local.infra["GCP ProjectID"]
}

output "region" {
  value = local.infra["Region"]
}

output "target_architecture" {
  value = local.infra["Target Architecture"]
}
