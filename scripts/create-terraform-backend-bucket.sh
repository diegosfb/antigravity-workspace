#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

bucket_name="${1:-amzn-s3-terraform-bucket}"
region="${2:-}"

read_setting() {
  local file="$1"
  local key="$2"
  awk -F': ' -v k="$key" 'tolower($1)==tolower(k){$1=""; sub(/^: /,""); print; exit}' "$file" \
    | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

if [[ -z "$region" && -f "$ENV_FILE" ]]; then
  infra_ref="$(awk -F'=' '/^INFRASTRUCTURE=/{sub(/^INFRASTRUCTURE=/, ""); print; exit}' "$ENV_FILE")"
  if [[ -n "$infra_ref" ]]; then
    if [[ "$infra_ref" = /* ]]; then
      infra_file="$infra_ref"
    else
      infra_file="$PROJECT_ROOT/$infra_ref"
    fi
    if [[ -f "$infra_file" ]]; then
      region="$(read_setting "$infra_file" "Region")"
    fi
  fi
fi

if [[ -z "$region" ]]; then
  region="$(aws configure get region 2>/dev/null || true)"
fi

if [[ -z "$region" ]]; then
  echo "Error: Unable to determine AWS region. Provide it as the second argument."
  echo "Usage: $0 [bucket-name] [region]"
  exit 1
fi

if aws s3api head-bucket --bucket "$bucket_name" >/dev/null 2>&1; then
  echo "Bucket $bucket_name already exists. Ensuring settings..."
else
  echo "Creating bucket $bucket_name in region $region..."
  if [[ "$region" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$bucket_name" --region "$region"
  else
    aws s3api create-bucket --bucket "$bucket_name" --region "$region" \
      --create-bucket-configuration LocationConstraint="$region"
  fi
fi

echo "Enabling versioning..."
aws s3api put-bucket-versioning --bucket "$bucket_name" \
  --versioning-configuration Status=Enabled

echo "Enabling default encryption (AES256)..."
aws s3api put-bucket-encryption --bucket "$bucket_name" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

echo "Blocking public access..."
aws s3api put-public-access-block --bucket "$bucket_name" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Done. Bucket is ready for Terraform state: $bucket_name"
