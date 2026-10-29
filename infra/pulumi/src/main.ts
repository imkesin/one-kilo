import * as GCP from "@pulumi/gcp"
import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"
import * as YAML from "js-yaml"
import { createAppDeployments } from "./k8s-apps.js"

const config = new Pulumi.Config()
const gcpConfig = new Pulumi.Config("gcp")
const imageTag = config.get("image-tag") ?? "latest"

const bootstrap = new Pulumi.StackReference(
  `${Pulumi.getOrganization()}/one-kilo-bootstrap/${Pulumi.getStack()}`
)

const cluster = new GCP.container.Cluster(
  "one-kilo-cluster",
  {
    location: gcpConfig.require("zone"),

    /*
     * GKE requires a node pool at creation; it is deleted immediately so `nodePool` below owns all nodes, and node
     * changes replace only that pool instead of the whole cluster.
     */
    removeDefaultNodePool: true,
    initialNodeCount: 1,

    datapathProvider: "ADVANCED_DATAPATH",
    maintenancePolicy: {
      recurringWindow: {
        startTime: "2026-01-01T05:00:00Z",
        endTime: "2026-01-01T10:00:00Z",
        recurrence: "FREQ=DAILY"
      }
    },
    managedOpentelemetryConfig: {
      scope: "COLLECTION_AND_INSTRUMENTATION_COMPONENTS"
    }
  }
)

const nodePool = new GCP.container.NodePool(
  "one-kilo-nodes",
  {
    cluster: cluster.id,
    nodeCount: config.requireNumber("node-count"),
    nodeConfig: {
      machineType: "e2-standard-2",
      diskSizeGb: 30,
      spot: true,
      serviceAccount: Pulumi.interpolate`${bootstrap.requireOutput("gkeNodesServiceAccountEmail")}`,
      oauthScopes: ["https://www.googleapis.com/auth/cloud-platform"]
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
  { kubeconfig },
  { dependsOn: [nodePool] }
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
                cpu: "50m",
                memory: "128Mi"
              },
              limits: {
                cpu: "250m",
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

createAppDeployments({
  k8sProvider,
  k8sNamespace,
  imageBase: Pulumi.interpolate`${bootstrap.requireOutput("imageRepositoryUrl")}`,
  imageTag
})
