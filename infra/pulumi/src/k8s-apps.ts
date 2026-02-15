import * as GCP from "@pulumi/gcp"
import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"

type CreateAppDeploymentsParameters = {
  readonly provider: K8s.Provider
  readonly repository: GCP.artifactregistry.Repository
  readonly projectName: string
  readonly imageTag: string
}

export function createAppDeployments({
  provider,
  repository,
  projectName,
  imageTag
}: CreateAppDeploymentsParameters) {
  const config = new Pulumi.Config()

  const imageBase = Pulumi.interpolate`${repository.location}-docker.pkg.dev/${projectName}/${repository.repositoryId}`

  const workosApiKeySecret = new K8s.core.v1.Secret(
    "workos-api-key",
    {
      stringData: {
        "api-key": config.requireSecret("workos-api-key")
      }
    },
    { provider }
  )

  const WEB_PORT = 3000
  const webLabels = { app: "web" } as const

  const _webDeployment = new K8s.apps.v1.Deployment(
    "web",
    {
      spec: {
        replicas: 1,
        selector: { matchLabels: webLabels },
        template: {
          metadata: { labels: webLabels },
          spec: {
            containers: [{
              name: "web",
              image: Pulumi.interpolate`${imageBase}/web:${imageTag}`,
              ports: [{ containerPort: WEB_PORT }]
            }]
          }
        }
      }
    },
    { provider }
  )
  const _webService = new K8s.core.v1.Service(
    "web",
    {
      metadata: { name: "web" },
      spec: {
        type: "ClusterIP",
        selector: webLabels,
        ports: [{ port: 80, targetPort: WEB_PORT }]
      }
    },
    { provider }
  )

  const SERVER_PORT = 10_000
  const SERVER_LABELS = { app: "server" } as const

  const _serverDeployment = new K8s.apps.v1.Deployment(
    "server",
    {
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
              env: [{
                name: "WORKOS_API_KEY",
                valueFrom: {
                  secretKeyRef: {
                    name: workosApiKeySecret.metadata.name,
                    key: "api-key"
                  }
                }
              }],
              livenessProbe: {
                httpGet: {
                  path: "/livez",
                  port: SERVER_PORT
                },
                initialDelaySeconds: 10,
                periodSeconds: 15
              }
            }]
          }
        }
      }
    },
    { provider }
  )
  const _serverService = new K8s.core.v1.Service(
    "server",
    {
      metadata: { name: "server" },
      spec: {
        type: "ClusterIP",
        selector: SERVER_LABELS,
        ports: [{ port: 80, targetPort: SERVER_PORT }]
      }
    },
    { provider }
  )
}
