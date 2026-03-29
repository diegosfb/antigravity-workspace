#!/bin/bash

set -euo pipefail

SERVICE_ARN_DEFAULT="arn:aws:apprunner:us-east-2:434045117808:service/battletris-server/1d985988d9d4450d9a1eb73ebc2c8aae"
REGION_DEFAULT="us-east-2"

SERVICE_ARN="${1:-$SERVICE_ARN_DEFAULT}"
REGION="${2:-$REGION_DEFAULT}"

if [[ -z "$SERVICE_ARN" ]]; then
  echo "Usage: $0 [service-arn] [region]"
  exit 1
fi

service_status=""
service_url=""
updated_at=""
service_name=""
latest_status=""
latest_type=""
latest_id=""
latest_started=""

fetch_service() {
  service_status=$(aws apprunner describe-service \
    --region "$REGION" \
    --service-arn "$SERVICE_ARN" \
    --query "Service.Status" \
    --output text)

  service_url=$(aws apprunner describe-service \
    --region "$REGION" \
    --service-arn "$SERVICE_ARN" \
    --query "Service.ServiceUrl" \
    --output text)

  updated_at=$(aws apprunner describe-service \
    --region "$REGION" \
    --service-arn "$SERVICE_ARN" \
    --query "Service.UpdatedAt" \
    --output text)

  service_name=$(aws apprunner describe-service \
    --region "$REGION" \
    --service-arn "$SERVICE_ARN" \
    --query "Service.ServiceName" \
    --output text)
}

fetch_latest_operation() {
  latest_status=$(aws apprunner list-operations \
    --region "$REGION" \
    --service-arn "$SERVICE_ARN" \
    --max-results 1 \
    --query "OperationSummaryList[0].Status" \
    --output text)

  latest_type=$(aws apprunner list-operations \
    --region "$REGION" \
    --service-arn "$SERVICE_ARN" \
    --max-results 1 \
    --query "OperationSummaryList[0].Type" \
    --output text)

  latest_id=$(aws apprunner list-operations \
    --region "$REGION" \
    --service-arn "$SERVICE_ARN" \
    --max-results 1 \
    --query "OperationSummaryList[0].Id" \
    --output text)

  latest_started=$(aws apprunner list-operations \
    --region "$REGION" \
    --service-arn "$SERVICE_ARN" \
    --max-results 1 \
    --query "OperationSummaryList[0].StartedAt" \
    --output text)
}

is_failed_or_rolled_back() {
  if [[ "$latest_status" == "FAILED" || "$latest_status" == *"ROLLBACK"* ]]; then
    return 0
  fi
  return 1
}

fetch_logs() {
  local service_id
  local log_groups
  local matched_group
  local log_stream

  service_id="${SERVICE_ARN##*/}"

  echo "Fetching recent App Runner logs..."
  if ! log_groups=$(aws logs describe-log-groups \
    --region "$REGION" \
    --log-group-name-prefix "/aws/apprunner" \
    --query "logGroups[].logGroupName" \
    --output text); then
    echo "Failed to fetch log groups."
    return
  fi

  matched_group=$(echo "$log_groups" | tr '\t' '\n' | grep -E -m 1 -e "$service_id" -e "$service_name" || true)
  if [[ -z "$matched_group" ]]; then
    echo "No App Runner log group found for service ${service_name} (${service_id})."
    return
  fi

  if ! log_stream=$(aws logs describe-log-streams \
    --region "$REGION" \
    --log-group-name "$matched_group" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --query "logStreams[0].logStreamName" \
    --output text); then
    echo "Failed to fetch log streams for ${matched_group}."
    return
  fi

  if [[ -z "$log_stream" || "$log_stream" == "None" ]]; then
    echo "No log streams found for ${matched_group}."
    return
  fi

  echo "Log group: ${matched_group}"
  echo "Log stream: ${log_stream}"
  aws logs get-log-events \
    --region "$REGION" \
    --log-group-name "$matched_group" \
    --log-stream-name "$log_stream" \
    --limit 50 \
    --query "events[].message" \
    --output text | tr '\t' '\n'
}

poll_until_running() {
  echo "Deployment in progress. Polling every 30 seconds until the service is running."
  echo "Service status: $service_status"
  echo "Latest operation: $latest_type ($latest_id)"
  echo "Latest operation status: $latest_status"
  echo "Started at: $latest_started"
  echo "Service URL: https://$service_url"

  while true; do
    aws apprunner list-operations \
      --region "$REGION" \
      --service-arn "$SERVICE_ARN" \
      --max-results 1

    fetch_service
    fetch_latest_operation

    if is_failed_or_rolled_back; then
      echo "Deployment failed or rolled back."
      echo "Service status: $service_status"
      echo "Latest operation: $latest_type ($latest_id)"
      echo "Latest operation status: $latest_status"
      fetch_logs
      exit 1
    fi

    if [[ "$service_status" == "RUNNING" && "$latest_status" != "IN_PROGRESS" ]]; then
      echo "Service is running."
      echo "Latest operation: $latest_type ($latest_id)"
      echo "Latest operation status: $latest_status"
      echo "Service updated at: $updated_at"
      echo "Service URL: https://$service_url"
      exit 0
    fi

    sleep 30
  done
}

fetch_service
fetch_latest_operation

if [[ "$latest_status" == "IN_PROGRESS" || "$service_status" == "OPERATION_IN_PROGRESS" ]]; then
  poll_until_running
fi

if [[ "$service_status" == "RUNNING" ]]; then
  echo "Service is running."
  echo "Latest operation: $latest_type ($latest_id)"
  echo "Latest operation status: $latest_status"
  echo "Service updated at: $updated_at"
  echo "Service URL: https://$service_url"
  exit 0
fi

if is_failed_or_rolled_back; then
  echo "Deployment failed or rolled back."
  echo "Service status: $service_status"
  echo "Latest operation: $latest_type ($latest_id)"
  echo "Latest operation status: $latest_status"
  fetch_logs
  exit 1
fi

echo "Service status: $service_status"
echo "Latest operation: $latest_type ($latest_id)"
echo "Latest operation status: $latest_status"
echo "Service URL: https://$service_url"
exit 1
