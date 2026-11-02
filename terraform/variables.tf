variable "project_id" {
  description = "GCP Project ID to deploy the mock DVLA app into"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "europe-west2" # London
}
