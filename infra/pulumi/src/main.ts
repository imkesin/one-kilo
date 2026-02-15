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
    nodeConfig: {
      machineType: "e2-medium",
      spot: true
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

const tunnelTokenSecret = new K8s.core.v1.Secret(
  "cloudflare-tunnel-token",
  {
    stringData: {
      token: config.requireSecret("cloudflare-tunnel-token")
    }
  },
  { provider: k8sProvider }
)

const _cloudflared = new K8s.apps.v1.Deployment(
  "cloudflared",
  {
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
            }]
          }]
        }
      }
    }
  },
  { provider: k8sProvider }
)

const artifactRegistryRepository = new GCP.artifactregistry.Repository(
  "one-kilo",
  {
    repositoryId: "one-kilo",
    format: "DOCKER",
    location: gcpConfig.require("region")
  }
)

const githubActions = createGithubActionsResources({
  repository: artifactRegistryRepository,
  cluster,
  githubRepositoryName: "imkesin/one-kilo"
})

createAppDeployments({
  provider: k8sProvider,
  repository: artifactRegistryRepository,
  projectName: gcpConfig.require("project"),
  imageTag
})

export const workloadIdentityPoolProviderName = githubActions.workloadIdentityPoolProvider.name
export const githubActionsServiceAccountEmail = githubActions.serviceAccount.email
