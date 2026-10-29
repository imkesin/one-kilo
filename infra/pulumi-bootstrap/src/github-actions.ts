import * as GCP from "@pulumi/gcp"
import * as Pulumi from "@pulumi/pulumi"

type CreateGithubActionsResourcesParameters = {
  readonly repository: GCP.artifactregistry.Repository
  readonly githubRepositoryName: string
}

export function createGithubActionsResources({
  repository,
  githubRepositoryName
}: CreateGithubActionsResourcesParameters) {
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
        "attribute.repository": "assertion.repository",
        "attribute.workflow_ref": "assertion.job_workflow_ref"
      },
      attributeCondition: `assertion.repository == "${githubRepositoryName}"`,
      oidc: {
        issuerUri: "https://token.actions.githubusercontent.com"
      }
    }
  )

  const ciServiceAccount = new GCP.serviceaccount.Account(
    "github-actions",
    {
      accountId: "github-actions",
      displayName: "GitHub Actions CI"
    }
  )

  const _ciRegistryWriter = new GCP.artifactregistry.RepositoryIamMember(
    "github-actions-registry-writer",
    {
      repository: repository.name,
      location: repository.location,
      role: "roles/artifactregistry.writer",
      member: Pulumi.interpolate`serviceAccount:${ciServiceAccount.email}`
    }
  )

  /*
   * Trusts only `ci.yaml`, and only when it runs from `main`.
   */
  const _ciWorkloadIdentityBinding = new GCP.serviceaccount.IAMMember(
    "github-actions-workload-identity-binding",
    {
      serviceAccountId: ciServiceAccount.name,
      role: "roles/iam.workloadIdentityUser",
      member: Pulumi
        .interpolate`principalSet://iam.googleapis.com/${workloadIdentityPool.name}/attribute.workflow_ref/${githubRepositoryName}/.github/workflows/ci.yaml@refs/heads/main`
    }
  )

  return {
    workloadIdentityPoolProvider,
    ciServiceAccount
  }
}
