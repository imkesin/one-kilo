import * as GCP from "@pulumi/gcp"
import * as Pulumi from "@pulumi/pulumi"

type CreateGithubActionsResourcesParameters = {
  readonly repository: GCP.artifactregistry.Repository
  readonly cluster: GCP.container.Cluster
  readonly githubRepositoryName: string
}

export function createGithubActionsResources(parameters: CreateGithubActionsResourcesParameters) {
  const serviceAccount = new GCP.serviceaccount.Account(
    "github-actions",
    {
      accountId: "github-actions",
      displayName: "GitHub Actions"
    }
  )

  const _repositoryIamMember = new GCP.artifactregistry.RepositoryIamMember(
    "github-actions-registry-writer",
    {
      repository: parameters.repository.name,
      location: parameters.repository.location,
      role: "roles/artifactregistry.writer",
      member: Pulumi.interpolate`serviceAccount:${serviceAccount.email}`
    }
  )

  const _gkeIamMember = new GCP.projects.IAMMember(
    "github-actions-gke-developer",
    {
      project: parameters.cluster.project,
      role: "roles/container.developer",
      member: Pulumi.interpolate`serviceAccount:${serviceAccount.email}`
    }
  )

  const workloadIdentityPool = new GCP.iam.WorkloadIdentityPool(
    "github-actions-pool",
    {
      workloadIdentityPoolId: "github-actions",
      displayName: "GitHub Actions"
    }
  )

  const workloadIdentityPoolProvider = new GCP.iam.WorkloadIdentityPoolProvider(
    "github-actions-provider",
    {
      workloadIdentityPoolId: workloadIdentityPool.workloadIdentityPoolId,
      workloadIdentityPoolProviderId: "github-oidc",
      displayName: "GitHub OIDC",
      attributeMapping: {
        "google.subject": "assertion.sub",
        "attribute.repository": "assertion.repository"
      },
      attributeCondition: `assertion.repository == "${parameters.githubRepositoryName}"`,
      oidc: {
        issuerUri: "https://token.actions.githubusercontent.com"
      }
    }
  )

  const _workloadIdentityBinding = new GCP.serviceaccount.IAMMember(
    "github-actions-workload-identity-binding",
    {
      serviceAccountId: serviceAccount.name,
      role: "roles/iam.workloadIdentityUser",
      member: Pulumi
        .interpolate`principalSet://iam.googleapis.com/${workloadIdentityPool.name}/attribute.repository/${parameters.githubRepositoryName}`
    }
  )

  return {
    serviceAccount,
    workloadIdentityPool,
    workloadIdentityPoolProvider
  }
}
