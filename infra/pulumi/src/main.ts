import * as GCP from "@pulumi/gcp"
import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"
import * as YAML from "js-yaml"
import { createGithubActionsResources } from "./github-actions.js"
import { createAppDeployments } from "./k8s-apps.js"

const config = new Pulumi.Config()
const gcpConfig = new Pulumi.Config("gcp")
const imageTag = config.get("imageTag") ?? "latest"

const cluster = new GCP.container.Cluster(
  "one-kilo-cluster",
  {
    location: gcpConfig.require("zone"),
    initialNodeCount: 1,
    addonsConfig: {
      gkeBackupAgentConfig: {
        enabled: true
      }
    },
    nodeConfig: {
      machineType: "e2-standard-4",
      spot: true
    },
    maintenancePolicy: {
      recurringWindow: {
        startTime: "2026-01-01T05:00:00Z",
        endTime: "2026-01-01T10:00:00Z",
        recurrence: "FREQ=DAILY"
      }
    }
  }
)

const _backupPlan = new GCP.gkebackup.BackupPlan(
  "one-kilo-cluster-backup-plan",
  {
    location: gcpConfig.require("region"),
    cluster: cluster.id,
    backupConfig: {
      allNamespaces: true,
      includeVolumeData: false,
      includeSecrets: true
    },
    backupSchedule: {
      cronSchedule: "0 3 * * *"
    },
    retentionPolicy: {
      backupRetainDays: 7
    }
  }
)

const kubeconfig = Pulumi
  .all([cluster.endpoint, cluster.masterAuth])
  .apply(([endpoint, auth]) =>
    YAML.dump({
      apiVersion: "v1",
      clusters: [{
        cluster: {
          "certificate-authority-data": auth.clusterCaCertificate,
          server: `https://${endpoint}`
        },
        name: "gke-cluster"
      }],
      contexts: [{
        context: {
          cluster: "gke-cluster",
          user: "gke-cluster"
        },
        name: "gke-cluster"
      }],
      "current-context": "gke-cluster",
      users: [{
        name: "gke-cluster",
        user: {
          exec: {
            apiVersion: "client.authentication.k8s.io/v1beta1",
            command: "gke-gcloud-auth-plugin"
          }
        }
      }]
    })
  )

const k8sProvider = new K8s.Provider(
  "gke",
  { kubeconfig }
)

const k8sNamespace = new K8s.core.v1.Namespace(
  "one-kilo",
  { metadata: { name: "one-kilo" } },
  { provider: k8sProvider }
)

const tunnelTokenSecret = new K8s.core.v1.Secret(
  "cloudflare-tunnel-token",
  {
    metadata: { namespace: k8sNamespace.metadata.name },
    stringData: {
      token: config.requireSecret("cloudflare-tunnel-token")
    }
  },
  {
    provider: k8sProvider,
    dependsOn: [k8sNamespace]
  }
)

const _cloudflared = new K8s.apps.v1.Deployment(
  "cloudflared",
  {
    metadata: { namespace: k8sNamespace.metadata.name },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: "cloudflared"
        }
      },
      template: {
        metadata: {
          labels: {
            app: "cloudflared"
          }
        },
        spec: {
          containers: [{
            name: "cloudflared",
            image: "cloudflare/cloudflared:latest",
            command: [
              "cloudflared",
              "tunnel",
              "--no-autoupdate",
              "run"
            ],
            env: [{
              name: "TUNNEL_TOKEN",
              valueFrom: {
                secretKeyRef: {
                  name: tunnelTokenSecret.metadata.name,
                  key: "token"
                }
              }
            }],
            resources: {
              requests: {
                cpu: "250m",
                memory: "128Mi"
              },
              limits: {
                cpu: "500m",
                memory: "256Mi"
              }
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

const artifactRegistryRepository = new GCP.artifactregistry.Repository(
  "one-kilo",
  {
    repositoryId: "one-kilo",
    format: "DOCKER",
    location: gcpConfig.require("region"),
    cleanupPolicies: [
      {
        id: "keep-latest-30",
        action: "KEEP",
        mostRecentVersions: {
          keepCount: 30
        }
      },
      {
        id: "delete-older-than-7d",
        action: "DELETE",
        condition: {
          olderThan: "7d"
        }
      }
    ]
  }
)

const githubActions = createGithubActionsResources({
  repository: artifactRegistryRepository,
  cluster,
  githubRepositoryName: "imkesin/one-kilo"
})

createAppDeployments({
  k8sProvider,
  k8sNamespace,
  repository: artifactRegistryRepository,
  projectName: gcpConfig.require("project"),
  imageTag
})

export const workloadIdentityPoolProviderName = githubActions.workloadIdentityPoolProvider.name
export const githubActionsServiceAccountEmail = githubActions.serviceAccount.email
