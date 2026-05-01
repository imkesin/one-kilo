import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"
import { appLabels, type SharedConfig } from "./shared-config.js"

export type CreateServerParameters = {
  readonly k8sProvider: K8s.Provider
  readonly k8sNamespace: K8s.core.v1.Namespace
  readonly imageBase: Pulumi.Output<string>
  readonly imageTag: string
  readonly sharedConfig: SharedConfig
}

const SERVER_PORT = 10000
const SERVER_SELECTOR = { app: "server" } as const
const SERVER_LABELS = appLabels("server")

export function createServer({
  k8sProvider,
  k8sNamespace,
  imageBase,
  imageTag,
  sharedConfig
}: CreateServerParameters) {
  const _deployment = new K8s.apps.v1.Deployment(
    "server",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      spec: {
        replicas: 1,
        selector: { matchLabels: SERVER_SELECTOR },
        template: {
          metadata: { labels: SERVER_LABELS },
          spec: {
            containers: [{
              name: "server",
              image: Pulumi.interpolate`${imageBase}/server:${imageTag}`,
              ports: [{ containerPort: SERVER_PORT }],
              envFrom: [
                { configMapRef: { name: sharedConfig.workosConfigMap.metadata.name } },
                { secretRef: { name: sharedConfig.workosApiKeySecret.metadata.name } },
                { configMapRef: { name: sharedConfig.postgresConfigMap.metadata.name } },
                { secretRef: { name: sharedConfig.postgresPasswordSecret.metadata.name } }
              ],
              resources: {
                requests: { cpu: "500m", memory: "1Gi" },
                limits: { cpu: "2000m", memory: "4Gi" }
              },
              startupProbe: {
                httpGet: { path: "/livez", port: SERVER_PORT },
                periodSeconds: 5,
                failureThreshold: 12
              },
              livenessProbe: {
                httpGet: { path: "/livez", port: SERVER_PORT },
                periodSeconds: 30
              }
            }]
          }
        }
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  const _service = new K8s.core.v1.Service(
    "server",
    {
      metadata: { name: "server", namespace: k8sNamespace.metadata.name },
      spec: {
        type: "ClusterIP",
        selector: SERVER_SELECTOR,
        ports: [{ port: 80, targetPort: SERVER_PORT }]
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )
}
