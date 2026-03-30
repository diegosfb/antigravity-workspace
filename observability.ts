import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

const enabled =
  process.env.OBSERVABILITY_ENABLED === "true" ||
  Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT);

if (enabled) {
  const logLevel = process.env.OTEL_LOG_LEVEL?.toLowerCase();
  if (logLevel) {
    const levelMap: Record<string, DiagLogLevel> = {
      error: DiagLogLevel.ERROR,
      warn: DiagLogLevel.WARN,
      info: DiagLogLevel.INFO,
      debug: DiagLogLevel.DEBUG,
      verbose: DiagLogLevel.VERBOSE,
      all: DiagLogLevel.ALL,
    };
    diag.setLogger(new DiagConsoleLogger(), levelMap[logLevel] ?? DiagLogLevel.INFO);
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || "battletris-server";
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || "unknown",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "unknown",
  });

  const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.replace(/\/$/, "");
  const traceEndpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    (baseEndpoint ? `${baseEndpoint}/v1/traces` : undefined);
  const metricEndpoint =
    process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
    (baseEndpoint ? `${baseEndpoint}/v1/metrics` : undefined);

  const traceExporter = new OTLPTraceExporter(
    traceEndpoint ? { url: traceEndpoint } : undefined
  );

  const metricExporter = new OTLPMetricExporter(
    metricEndpoint ? { url: metricEndpoint } : undefined
  );

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60_000,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  void sdk.start();

  const shutdown = async () => {
    try {
      await sdk.shutdown();
    } catch (err) {
      console.error("[otel] shutdown failed", err);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
