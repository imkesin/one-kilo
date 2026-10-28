import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"

const OTEL_COLLECTOR_ENDPOINT = "http://opentelemetry-collector.gke-managed-otel.svc.cluster.local:4318"
const OTEL_METRIC_EXPORT_INTERVAL_MS = 30_000

export type SharedConfig = {
  readonly workosConfigMap: K8s.core.v1.ConfigMap
  readonly workosApiKeySecret: K8s.core.v1.Secret
  readonly postgresConfigMap: K8s.core.v1.ConfigMap
  readonly postgresPasswordSecret: K8s.core.v1.Secret
}

export type CreateSharedConfigParameters = {
  readonly k8sProvider: K8s.Provider
  readonly k8sNamespace: K8s.core.v1.Namespace
}

export function createSharedConfig({
  k8sProvider,
  k8sNamespace
}: CreateSharedConfigParameters): SharedConfig {
  const config = new Pulumi.Config()

  const workosConfigMap = new K8s.core.v1.ConfigMap(
    "workos-config",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      data: {
        WORKOS_CLIENT_ID: config.require("workos-client-id")
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  const workosApiKeySecret = new K8s.core.v1.Secret(
    "workos-api-key",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      stringData: {
        WORKOS_API_KEY: config.requireSecret("workos-api-key")
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  const postgresConfigMap = new K8s.core.v1.ConfigMap(
    "postgres-config",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      data: {
        POSTGRES_HOST: config.require("postgres-host"),
        POSTGRES_PORT: config.require("postgres-port"),
        POSTGRES_USER: config.require("postgres-user"),
        POSTGRES_DB: config.require("postgres-db")
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  const postgresPasswordSecret = new K8s.core.v1.Secret(
    "postgres-password",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      stringData: {
        POSTGRES_PASSWORD: config.requireSecret("postgres-password")
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  return {
    workosConfigMap,
    workosApiKeySecret,
    postgresConfigMap,
    postgresPasswordSecret
  }
}

export const podEnv: K8s.types.input.core.v1.EnvVar[] = [
  {
    name: "POD_NAME",
    valueFrom: { fieldRef: { fieldPath: "metadata.name" } }
  },
  {
    name: "POD_NAMESPACE",
    valueFrom: { fieldRef: { fieldPath: "metadata.namespace" } }
  }
]

export type TelemetryEnvParameters = {
  readonly containerName: string
  readonly serviceVersion: string
}

/*
 * Must follow `podEnv` in a container's `env`: `$(VAR)` references only resolve against earlier entries.
 */
export function telemetryEnv({
  containerName,
  serviceVersion
}: TelemetryEnvParameters): K8s.types.input.core.v1.EnvVar[] {
  return [
    { name: "SERVICE_VERSION", value: serviceVersion },
    { name: "OTEL_EXPORTER_OTLP_ENDPOINT", value: OTEL_COLLECTOR_ENDPOINT },
    { name: "OTEL_TRACES_EXPORTER", value: "otlp" },
    { name: "OTEL_METRICS_EXPORTER", value: "otlp" },
    { name: "OTEL_LOGS_EXPORTER", value: "otlp" },
    { name: "OTEL_METRIC_EXPORT_INTERVAL", value: String(OTEL_METRIC_EXPORT_INTERVAL_MS) },
    {
      name: "OTEL_RESOURCE_ATTRIBUTES",
      value: [
        `service.instance.id=$(POD_NAMESPACE).$(POD_NAME).${containerName}`,
        "k8s.namespace.name=$(POD_NAMESPACE)",
        "k8s.pod.name=$(POD_NAME)",
        `k8s.container.name=${containerName}`
      ].join(",")
    }
  ]
}

export function appLabels(name: string): Record<string, string> {
  return {
    app: name,
    "app.kubernetes.io/name": name,
    "app.kubernetes.io/managed-by": "pulumi"
  }
}
