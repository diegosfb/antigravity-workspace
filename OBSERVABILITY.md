# Observability (OpenTelemetry)

This project supports **optional** OpenTelemetry tracing and metrics. It is disabled by default to avoid overhead in local development.

## How It Works
- Instrumentation is enabled via `observability.ts` and auto‑instrumentation.
- When enabled, traces and metrics are exported via **OTLP HTTP**.

## Enable Observability

Enable by setting either:
- `OBSERVABILITY_ENABLED=true`, **or**
- `OTEL_EXPORTER_OTLP_ENDPOINT` (recommended)

Example:

```bash
export OBSERVABILITY_ENABLED=true
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"

npm run dev
```

## Optional Settings

```bash
# Service identity
export OTEL_SERVICE_NAME="battletris-server"

# Environment label
export NODE_ENV="dev"

# Logging verbosity
export OTEL_LOG_LEVEL="info"

# Explicit endpoints (override OTEL_EXPORTER_OTLP_ENDPOINT)
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://localhost:4318/v1/traces"
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT="http://localhost:4318/v1/metrics"
```

## What Gets Instrumented
The Node.js auto‑instrumentation package captures:
- HTTP server spans
- Express middleware spans
- DNS, network, and other common Node subsystems

## Troubleshooting
- **No data in the collector**: verify the OTLP endpoint is reachable from the server.
- **Verbose logs**: set `OTEL_LOG_LEVEL=warn` or `error`.
- **Disabled by default**: you must set `OBSERVABILITY_ENABLED=true` or `OTEL_EXPORTER_OTLP_ENDPOINT`.

## Collector Notes
This setup expects an OTLP HTTP collector. If you use OTLP gRPC, update the exporters accordingly.
