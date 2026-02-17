import * as GCP from "@pulumi/gcp"
import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"

type CreateAppDeploymentsParameters = {
  readonly k8sProvider: K8s.Provider
  readonly k8sNamespace: K8s.core.v1.Namespace
  readonly repository: GCP.artifactregistry.Repository
  readonly projectName: string
  readonly imageTag: string
}

export function createAppDeployments({
  k8sProvider,
  k8sNamespace,
  repository,
  projectName,
  imageTag
}: CreateAppDeploymentsParameters) {
  const config = new Pulumi.Config()

  const imageBase = Pulumi.interpolate`${repository.location}-docker.pkg.dev/${projectName}/${repository.repositoryId}`

  const workosApiKeySecret = new K8s.core.v1.Secret(
    "workos-api-key",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      stringData: {
        "api-key": config.requireSecret("workos-api-key")
      }
    },
    {
      provider: k8sProvider,
      dependsOn: [k8sNamespace]
    }
  )

  const WEB_PORT = 3000
  const webLabels = { app: "web" } as const

  const _webDeployment = new K8s.apps.v1.Deployment(
    "web",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      spec: {
        replicas: 1,
        selector: { matchLabels: webLabels },
        template: {
          metadata: { labels: webLabels },
          spec: {
            containers: [{
              name: "web",
              image: Pulumi.interpolate`${imageBase}/web:${imageTag}`,
              ports: [{ containerPort: WEB_PORT }],
              env: [
                {
                  name: "WORKOS_CLIENT_ID",
                  value: config.require("workos-client-id")
                }
              ],
              resources: {
                requests: { cpu: "500m", memory: "512Mi" },
                limits: { cpu: "1000m", memory: "1Gi" }
              },
              livenessProbe: {
                httpGet: {
                  path: "/livez",
                  port: WEB_PORT
                },
                initialDelaySeconds: 10,
                periodSeconds: 30
              }
            }]
          }
        }
      }
    },
    {
      provider: k8sProvider,
      dependsOn: [k8sNamespace]
    }
  )
  const _webService = new K8s.core.v1.Service(
    "web",
    {
      metadata: { name: "web", namespace: k8sNamespace.metadata.name },
      spec: {
        type: "ClusterIP",
        selector: webLabels,
        ports: [{ port: 80, targetPort: WEB_PORT }]
      }
    },
    {
      provider: k8sProvider,
      dependsOn: [k8sNamespace]
    }
  )

  const SERVER_PORT = 10_000
  const SERVER_LABELS = { app: "server" } as const

  const _serverDeployment = new K8s.apps.v1.Deployment(
    "server",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      spec: {
        replicas: 1,
        selector: { matchLabels: SERVER_LABELS },
        template: {
          metadata: { labels: SERVER_LABELS },
          spec: {
            containers: [{
              name: "server",
              image: Pulumi.interpolate`${imageBase}/server:${imageTag}`,
              ports: [{ containerPort: SERVER_PORT }],
              env: [
                {
                  name: "WORKOS_CLIENT_ID",
                  value: config.require("workos-client-id")
                },
                {
                  name: "WORKOS_API_KEY",
                  valueFrom: {
                    secretKeyRef: {
                      name: workosApiKeySecret.metadata.name,
                      key: "api-key"
                    }
                  }
                }
              ],
              resources: {
                requests: { cpu: "500m", memory: "512Mi" },
                limits: { cpu: "1000m", memory: "1Gi" }
              },
              livenessProbe: {
                httpGet: {
                  path: "/livez",
                  port: SERVER_PORT
                },
                initialDelaySeconds: 10,
                periodSeconds: 30
              }
            }]
          }
        }
      }
    },
    {
      provider: k8sProvider,
      dependsOn: [k8sNamespace]
    }
  )
  const _serverService = new K8s.core.v1.Service(
    "server",
    {
      metadata: { name: "server", namespace: k8sNamespace.metadata.name },
      spec: {
        type: "ClusterIP",
        selector: SERVER_LABELS,
        ports: [{ port: 80, targetPort: SERVER_PORT }]
      }
    },
    {
      provider: k8sProvider,
      dependsOn: [k8sNamespace]
    }
  )
}
