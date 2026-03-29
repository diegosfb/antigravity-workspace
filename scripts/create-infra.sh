#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <infra-yaml-path>"
  exit 1
fi

INFRA_FILE="$1"
if [[ "$INFRA_FILE" != /* ]]; then
  INFRA_FILE="$PROJECT_ROOT/$INFRA_FILE"
fi

if [[ ! -f "$INFRA_FILE" ]]; then
  echo "Error: Infra file not found: $INFRA_FILE"
  exit 1
fi

read_setting() {
  local file="$1"
  local key="$2"
  awk -F': ' -v k="$key" 'tolower($1)==tolower(k){$1=""; sub(/^: /,""); print; exit}' "$file"
}

read_env_setting() {
  local file="$1"
  local key="$2"
  awk -v k="$key" '
    $0 ~ "^"k"[=:]" {
      sub("^"k"[=:]", "");
      gsub(/^\s+|\s+$/, "");
      gsub(/^"|"$/, "");
      print;
      exit
    }
  ' "$file"
}

STACK_NAME="$(basename "$INFRA_FILE" .yaml)"
STACK_DIR="$PROJECT_ROOT/config/Infrastructure/terraform/$STACK_NAME"

if [[ ! -d "$STACK_DIR" ]]; then
  echo "Error: Terraform stack not found for $STACK_NAME at $STACK_DIR"
  exit 1
fi

show_aws_account() {
  local account
  if account=$(aws sts get-caller-identity --query Account --output text 2>/dev/null); then
    echo "AWS account: $account"
    return 0
  fi

  local profiles
  profiles=$(aws configure list-profiles 2>/dev/null || true)
  local profile_count
  profile_count=$(echo "$profiles" | sed '/^$/d' | wc -l | tr -d ' ')

  if [[ "$profile_count" -gt 1 && -z "${AWS_PROFILE:-}" ]]; then
    echo "Multiple AWS profiles detected. Choose one:"
    select prof in $profiles; do
      if [[ -n "$prof" ]]; then
        export AWS_PROFILE="$prof"
        break
      fi
    done
  fi

  account=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || true)
  if [[ -z "$account" || "$account" == "None" ]]; then
    echo "Error: No AWS credentials available. Configure AWS credentials first."
    exit 1
  fi
  echo "AWS account: $account"
}

show_gcp_account() {
  local active
  active=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || true)
  if [[ -z "$active" ]]; then
    echo "Error: No active GCP account. Run 'gcloud auth login' and retry."
    exit 1
  fi
  echo "GCP account: $active"
}

setup_render_env() {
  local env_file="$PROJECT_ROOT/config/.env"
  if [[ ! -f "$env_file" ]]; then
    echo "Error: $env_file not found. Add RenderApiKey and RenderOwnerID or provide them manually."
    exit 1
  fi

  local api_key owner_id
  api_key=$(read_env_setting "$env_file" "RenderApiKey")
  owner_id=$(read_env_setting "$env_file" "RenderOwnerID")

  if [[ -z "$api_key" || -z "$owner_id" ]]; then
    echo "config/.env missing RenderApiKey or RenderOwnerID."
    echo "Provide values now or add them to config/.env."
    if [[ -z "$api_key" ]]; then
      read -r -p "RenderApiKey: " api_key
    fi
    if [[ -z "$owner_id" ]]; then
      read -r -p "RenderOwnerID: " owner_id
    fi
    if [[ -z "$api_key" || -z "$owner_id" ]]; then
      echo "Error: RenderApiKey and RenderOwnerID are required."
      exit 1
    fi
  fi

  export RENDER_API_KEY="$api_key"
  export RENDER_OWNER_ID="$owner_id"
  echo "Render owner: $owner_id"
}

case "$STACK_NAME" in
  aws|aws-dev)
    show_aws_account
    ;;
  gcp)
    show_gcp_account
    ;;
  render|render-dev)
    setup_render_env
    ;;
  local)
    echo "Local infra stack selected; no provisioning required."
    exit 0
    ;;
  *)
    echo "Error: Unknown stack name '$STACK_NAME'"
    exit 1
    ;;
 esac

(
  cd "$STACK_DIR"
  terraform init
  terraform apply -auto-approve
)

case "$STACK_NAME" in
  gcp)
    gcp_project=$(read_setting "$INFRA_FILE" "GCP ProjectID")
    gcp_region=$(read_setting "$INFRA_FILE" "Region")
    gcp_service=$(read_setting "$INFRA_FILE" "WebService")
    if [[ -n "$gcp_project" && -n "$gcp_region" && -n "$gcp_service" ]]; then
      gcloud run services add-iam-policy-binding "$gcp_service" \
        --region "$gcp_region" \
        --project "$gcp_project" \
        --member "allUsers" \
        --role "roles/run.invoker"
    fi
    ;;
  aws|aws-dev)
    echo "App Runner services are public by default."
    ;;
  render|render-dev)
    echo "Render web services are public by default."
    ;;
 esac

infra_url=""
if infra_url=$(cd "$STACK_DIR" && terraform output -raw service_url 2>/dev/null); then
  :
else
  infra_url=""
fi

if [[ -z "$infra_url" ]]; then
  infra_url=$(read_setting "$INFRA_FILE" "Deployment URL")
fi

if [[ -z "$infra_url" ]]; then
  infra_url="unknown"
fi

LOG_FILE="$PROJECT_ROOT/config/Infrastructure/infra.log"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
INFRA_NAME=$(basename "$INFRA_FILE")

echo "$TIMESTAMP infra=$INFRA_NAME url=$infra_url" >> "$LOG_FILE"

echo "Infra created: $INFRA_NAME"
echo "URL: $infra_url"
