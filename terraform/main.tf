provider "google" {
  project = var.project_id
  region  = var.region
}

# Intentional Misconfig 1: World-readable storage bucket for V5C document uploads
resource "google_storage_bucket" "v5c_uploads" {
  name                        = "${var.project_id}-dvla-v5c-uploads"
  location                    = "EU"
  force_destroy               = true
  # Trivy/Checkov Trigger: Missing uniform bucket level access
  uniform_bucket_level_access = false
}

resource "google_storage_bucket_iam_binding" "public_bucket_access" {
  bucket = google_storage_bucket.v5c_uploads.name
  role   = "roles/storage.objectViewer"
  members = [
    "allUsers" # Publicly accessible
  ]
}

# Intentional Misconfig 2: Overprivileged Service Account
resource "google_service_account" "dvla_app_sa" {
  account_id   = "dvla-runner-sa"
  display_name = "DVLA Service Account"
}

resource "google_project_iam_member" "excessive_privilege" {
  project = var.project_id
  role    = "roles/editor" # Checkov/CSPM Trigger: Excessive permissions
  member  = "serviceAccount:${google_service_account.dvla_app_sa.email}"
}

# Cloud Run deployment (Backend API)
resource "google_cloud_run_service" "dvla_app" {
  name     = "mock-dvla-service"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.dvla_app_sa.email
      containers {
        image = "gcr.io/${var.project_id}/mock-dvla-app:latest"
        resources {
          limits = {
            memory = "512Mi"
          }
        }
      }
    }
  }
}

# Intentional Misconfig 3: Publicly unauthenticated access to Cloud Run
resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_service.dvla_app.location
  project  = google_cloud_run_service.dvla_app.project
  service  = google_cloud_run_service.dvla_app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
