import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"
import { appLabels, type SharedConfig } from "./shared-config.js"

export type CreateWebParameters = {
  readonly k8sProvider: K8s.Provider
  readonly k8sNamespace: K8s.core.v1.Namespace
  readonly imageBase: Pulumi.Output<string>
  readonly imageTag: string
  readonly sharedConfig: SharedConfig
}

const WEB_PORT = 11000
const WEB_SELECTOR = { app: "web" } as const
const WEB_LABELS = appLabels("web")

export function createWeb({
  k8sProvider,
  k8sNamespace,
  imageBase,
  imageTag,
  sharedConfig
}: CreateWebParameters) {
  const _deployment = new K8s.apps.v1.Deployment(
    "web",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      spec: {
        replicas: 1,
        selector: { matchLabels: WEB_SELECTOR },
        template: {
          metadata: { labels: WEB_LABELS },
          spec: {
            containers: [{
              name: "web",
              image: Pulumi.interpolate`${imageBase}/web:${imageTag}`,
              ports: [{ containerPort: WEB_PORT }],
              envFrom: [
                { configMapRef: { name: sharedConfig.workosConfigMap.metadata.name } }
              ],
              resources: {
                requests: { cpu: "500m", memory: "512Mi" },
                limits: { cpu: "1000m", memory: "1Gi" }
              },
              startupProbe: {
                httpGet: { path: "/livez", port: WEB_PORT },
                periodSeconds: 5,
                failureThreshold: 12
              },
              livenessProbe: {
                httpGet: { path: "/livez", port: WEB_PORT },
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
    "web",
    {
      metadata: { name: "web", namespace: k8sNamespace.metadata.name },
      spec: {
        type: "ClusterIP",
        selector: WEB_SELECTOR,
        ports: [{ port: 80, targetPort: WEB_PORT }]
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )
}
