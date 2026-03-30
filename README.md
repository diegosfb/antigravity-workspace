<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2b73cc58-b9a8-425b-a6b8-f9842a565dad

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Observability (OpenTelemetry)

This server ships with **optional** OpenTelemetry tracing and metrics. It is disabled by default.

### Enable tracing + metrics

Set an OTLP endpoint (HTTP) or enable explicitly:

```bash
export OBSERVABILITY_ENABLED=true
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
npm run dev
```

### Optional settings

```bash
export OTEL_SERVICE_NAME="battletris-server"
export OTEL_LOG_LEVEL="info"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://localhost:4318/v1/traces"
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT="http://localhost:4318/v1/metrics"
```

## Secret Lifecycle Guidance

Right now secrets are managed via:
- `.env` / `config/.env` (local files)
- environment YAMLs (infrastructure config)

This works early on, but as deployments grow it creates three risks:

1. **Secret sprawl**  
   The same secret ends up copied into multiple places (dev, qa, uat, prod). That makes it hard to know which value is current and where it’s used.

2. **No rotation policy**  
   If a key is compromised, you’d have to manually update multiple files and redeploy everywhere. There’s no standard rotation or audit trail.

3. **Access control & audit gaps**  
   `.env` files aren’t tied to IAM policies or audit logs. A secret manager gives you:
   - access control (who can read it)
   - version history
   - automatic rotation support

What it means in practice:
As the number of environments grows, manual secrets quickly become brittle and unsafe. A centralized secret manager avoids duplication, provides auditability, and makes rotation manageable.
