#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

read_setting() {
  local file="$1"
  local key="$2"
  awk -F': ' -v k="$key" 'tolower($1)==tolower(k){$1=""; sub(/^: /,""); print; exit}' "$file" \
    | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

read_setting_any() {
  local file="$1"
  shift
  local key
  for key in "$@"; do
    local val
    val="$(read_setting "$file" "$key")"
    if [[ -n "$val" ]]; then
      echo "$val"
      return 0
    fi
  done
  echo ""
}

infra_ref=""
if [[ -f "$ENV_FILE" ]]; then
  infra_ref="$(awk -F'=' '/^INFRASTRUCTURE=/{sub(/^INFRASTRUCTURE=/, ""); print; exit}' "$ENV_FILE")"
fi

if [[ -z "$infra_ref" ]]; then
  echo "Error: INFRASTRUCTURE not set in .env. Run ./scripts/switch-env.sh first."
  exit 1
fi

if [[ "$infra_ref" = /* ]]; then
  infra_file="$infra_ref"
else
  infra_file="$PROJECT_ROOT/$infra_ref"
fi

if [[ ! -f "$infra_file" ]]; then
  echo "Error: Infrastructure file $infra_file not found."
  exit 1
fi

region="$(read_setting_any "$infra_file" "Region")"
service_name="$(read_setting_any "$infra_file" "WebService" "AWS Service" "Service Name" "Service")"
app_image="$(read_setting_any "$infra_file" "Application Image" "ApplicationImage" "Image")"
tag="$(read_setting_any "$infra_file" "Tag" "Image Tag")"
account_id="$(read_setting_any "$infra_file" "AccountID" "Account Id" "Account")"
target_arch="$(read_setting_any "$infra_file" "Target Architecture" "TargetArchitecture")"
service_arn="$(read_setting_any "$infra_file" "Service ARN" "ServiceArn")"

if [[ -z "$region" || -z "$service_name" || -z "$account_id" || -z "$app_image" ]]; then
  echo "Error: Missing required fields in $infra_file. Need Region, WebService, AccountID, Application Image."
  exit 1
fi

if [[ -z "$target_arch" ]]; then
  echo "Error: Missing Target Architecture in $infra_file."
  exit 1
fi

if [[ -z "$tag" ]]; then
  tag="latest"
fi

aws_account=""
if aws_account=$(aws sts get-caller-identity --query Account --output text 2>/dev/null); then
  echo "AWS account in use: $aws_account"
else
  echo "Error: AWS credentials are not available. Configure credentials or inject them via @config-manager."
  exit 1
fi

local_image="$service_name"
if [[ "$app_image" == *".amazonaws.com/"* ]]; then
  local_image="$(basename "$app_image")"
  local_image="${local_image%%:*}"
else
  local_image="$app_image"
fi

registry="${account_id}.dkr.ecr.${region}.amazonaws.com"
if [[ "$app_image" == *".amazonaws.com/"* ]]; then
  if [[ "$app_image" == *":"* ]]; then
    ecr_image="$app_image"
  else
    ecr_image="${app_image}:${tag}"
  fi
  registry="${app_image%%/*}"
else
  ecr_image="${registry}/${app_image}:${tag}"
fi

if [[ -z "$service_arn" ]]; then
  service_arn=$(aws apprunner list-services \
    --region "$region" \
    --query "ServiceSummaryList[?ServiceName=='${service_name}'].ServiceArn | [0]" \
    --output text)
fi

if [[ -z "$service_arn" || "$service_arn" == "None" ]]; then
  echo "Error: Unable to resolve App Runner service ARN for ${service_name}."
  exit 1
fi

echo "Building Docker image for ${target_arch}..."
docker build --platform "$target_arch" -t "$local_image" .

echo "Logging in to ECR registry ${registry}..."
aws ecr get-login-password --region "$region" | docker login --username AWS --password-stdin "$registry"

echo "Tagging image: ${local_image}:latest -> ${ecr_image}"
docker tag "${local_image}:latest" "$ecr_image"

echo "Pushing image to ECR..."
docker push "$ecr_image"

echo "Starting App Runner deployment..."
aws apprunner start-deployment --service-arn "$service_arn" --region "$region"

service_url=$(aws apprunner describe-service \
  --region "$region" \
  --service-arn "$service_arn" \
  --query "Service.ServiceUrl" \
  --output text)

echo "Deployment triggered for ${service_name} in ${region}."
echo "Service URL: https://${service_url}"
