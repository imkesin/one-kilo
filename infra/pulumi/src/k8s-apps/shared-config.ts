import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"

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

export function appLabels(name: string): Record<string, string> {
  return {
    app: name,
    "app.kubernetes.io/name": name,
    "app.kubernetes.io/managed-by": "pulumi"
  }
}
