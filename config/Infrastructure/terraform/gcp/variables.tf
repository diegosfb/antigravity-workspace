variable "service_name" {
  type        = string
  description = "Cloud Run service name"
  default     = "battletris-server"
}

variable "repository_id" {
  type        = string
  description = "Artifact Registry repository id"
  default     = "cloud-run-source-deploy"
}

variable "image_uri" {
  type        = string
  description = "Container image URI for Cloud Run"
}

variable "container_port" {
  type        = number
  description = "Container port"
  default     = 8080
}
