import * as GCP from "@pulumi/gcp"
import * as Pulumi from "@pulumi/pulumi"
import { createGithubActionsResources } from "./github-actions.js"

const gcpConfig = new Pulumi.Config("gcp")
const project = gcpConfig.require("project")

/*
 * Resources that call a Google API depend on `apis`, so a fresh project enables them before first use.
 */
const apis = [
  "artifactregistry",
  "cloudresourcemanager",
  "cloudtrace",
  "container",
  "iam",
  "iamcredentials",
  "logging",
  "monitoring",
  "sts",
  "telemetry"
].map((api) =>
  new GCP.projects.Service(
    `${api}-api`,
    {
      service: `${api}.googleapis.com`,
      disableOnDestroy: false
    }
  )
)

const _defaultLogBucket = new GCP.logging.ProjectBucketConfig(
  "default-log-bucket",
  {
    project,
    location: "global",
    bucketId: "_Default",
    retentionDays: 28
  },
  { dependsOn: apis }
)

const _defaultLogSink = new GCP.logging.ProjectSink(
  "default-log-sink",
  {
    name: "_Default",
    destination: `logging.googleapis.com/projects/${project}/locations/global/buckets/_Default`,
    exclusions: [
      {
        name: "gke-heartbeat-logs",
        filter: [
          "resource.type=\"k8s_cluster\"",
          "(",
          "protoPayload.methodName=\"io.k8s.coordination.v1.leases.update\"",
          "OR protoPayload.methodName=\"io.k8s.coordination.v1.leases.create\"",
          "OR protoPayload.methodName=\"io.k8s.core.v1.configmaps.update\"",
          ")"
        ].join("\n")
      },
      {
        name: "fluentbit-logs",
        filter: `logName="projects/${project}/logs/fluentbit"`
      }
    ],
    uniqueWriterIdentity: true
  },
  { dependsOn: apis }
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
  },
  { protect: true, dependsOn: apis }
)

const gkeNodesServiceAccount = new GCP.serviceaccount.Account(
  "gke-nodes",
  {
    accountId: "gke-nodes",
    displayName: "GKE nodes"
  },
  { dependsOn: apis }
)

const gkeNodesMember = Pulumi.interpolate`serviceAccount:${gkeNodesServiceAccount.email}`

const _gkeNodesDefaultNodeRole = new GCP.projects.IAMMember(
  "gke-nodes-default-node-service-account",
  {
    project,
    role: "roles/container.defaultNodeServiceAccount",
    member: gkeNodesMember
  }
)

/*
 * Adds `telemetry.traces.write` (Cloud Trace via the Telemetry API) on top of the default node role.
 */
const _gkeNodesTelemetryWriter = new GCP.projects.IAMMember(
  "gke-nodes-telemetry-writer",
  {
    project,
    role: "roles/telemetry.writer",
    member: gkeNodesMember
  }
)

const _gkeNodesRegistryReader = new GCP.artifactregistry.RepositoryIamMember(
  "gke-nodes-registry-reader",
  {
    repository: artifactRegistryRepository.name,
    location: artifactRegistryRepository.location,
    role: "roles/artifactregistry.reader",
    member: gkeNodesMember
  }
)

const githubActions = createGithubActionsResources({
  apis,
  repository: artifactRegistryRepository,
  githubRepositoryName: "imkesin/one-kilo"
})

export const imageRepositoryUrl = Pulumi
  .interpolate`${artifactRegistryRepository.location}-docker.pkg.dev/${project}/${artifactRegistryRepository.repositoryId}`
export const gkeNodesServiceAccountEmail = gkeNodesServiceAccount.email
export const workloadIdentityPoolProviderName = githubActions.workloadIdentityPoolProvider.name
export const ciServiceAccountEmail = githubActions.ciServiceAccount.email
