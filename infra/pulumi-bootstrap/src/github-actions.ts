import * as GCP from "@pulumi/gcp"
import * as Pulumi from "@pulumi/pulumi"
import * as PulumiService from "@pulumi/pulumiservice"

type CreateGithubActionsResourcesParameters = {
  readonly project: string
  readonly repository: GCP.artifactregistry.Repository
  readonly gkeNodesServiceAccount: GCP.serviceaccount.Account
  readonly githubRepositoryName: string
}

export function createGithubActionsResources({
  project,
  repository,
  gkeNodesServiceAccount,
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

  /*
   * Each service account trusts exactly one workflow file, and only when it runs from `main`.
   */
  const workflowPrincipal = (workflowFile: string) =>
    Pulumi
      .interpolate`principalSet://iam.googleapis.com/${workloadIdentityPool.name}/attribute.workflow_ref/${githubRepositoryName}/.github/workflows/${workflowFile}@refs/heads/main`

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

  const _ciWorkloadIdentityBinding = new GCP.serviceaccount.IAMMember(
    "github-actions-workload-identity-binding",
    {
      serviceAccountId: ciServiceAccount.name,
      role: "roles/iam.workloadIdentityUser",
      member: workflowPrincipal("ci.yaml")
    }
  )

  const deployServiceAccount = new GCP.serviceaccount.Account(
    "github-deploy",
    {
      accountId: "github-deploy",
      displayName: "GitHub Actions Deploy"
    }
  )

  const deployMember = Pulumi.interpolate`serviceAccount:${deployServiceAccount.email}`

  const _deployContainerAdmin = new GCP.projects.IAMMember(
    "github-deploy-container-admin",
    {
      project,
      role: "roles/container.admin",
      member: deployMember
    }
  )

  const _deployGkeBackupAdmin = new GCP.projects.IAMMember(
    "github-deploy-gkebackup-admin",
    {
      project,
      role: "roles/gkebackup.admin",
      member: deployMember
    }
  )

  const _deployGkeNodesUser = new GCP.serviceaccount.IAMMember(
    "github-deploy-gke-nodes-user",
    {
      serviceAccountId: gkeNodesServiceAccount.name,
      role: "roles/iam.serviceAccountUser",
      member: deployMember
    }
  )

  const _deployWorkloadIdentityBinding = new GCP.serviceaccount.IAMMember(
    "github-deploy-workload-identity-binding",
    {
      serviceAccountId: deployServiceAccount.name,
      role: "roles/iam.workloadIdentityUser",
      member: workflowPrincipal("deploy.yaml")
    }
  )

  /*
   * Lets the deploy workflow exchange its GitHub ID token for a short-lived Pulumi Cloud token. On an
   * individual Pulumi account the organization name is also the user login.
   */
  const pulumiOrganization = Pulumi.getOrganization()

  const _deployPulumiCloudIssuer = new PulumiService.OidcIssuer(
    "github-actions-pulumi-cloud",
    {
      organization: pulumiOrganization,
      name: "github-actions",
      url: "https://token.actions.githubusercontent.com",
      maxExpirationSeconds: 2 * 60 * 60,
      policies: [
        {
          decision: PulumiService.AuthPolicyDecision.Allow,
          tokenType: PulumiService.AuthPolicyTokenType.Personal,
          userLogin: pulumiOrganization,
          rules: {
            aud: `urn:pulumi:org:${pulumiOrganization}`,
            sub: `repo:${githubRepositoryName}:*`,
            job_workflow_ref: `${githubRepositoryName}/.github/workflows/deploy.yaml@refs/heads/main`
          }
        }
      ]
    }
  )

  return {
    workloadIdentityPoolProvider,
    ciServiceAccount,
    deployServiceAccount
  }
}
