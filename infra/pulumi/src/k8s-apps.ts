import * as GCP from "@pulumi/gcp"
import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"
import { createRunner } from "./k8s-apps/runner.js"
import { createServer } from "./k8s-apps/server.js"
import { createSharedConfig } from "./k8s-apps/shared-config.js"
import { createWeb } from "./k8s-apps/web.js"

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
  const imageBase = Pulumi.interpolate`${repository.location}-docker.pkg.dev/${projectName}/${repository.repositoryId}`

  const sharedConfig = createSharedConfig({ k8sProvider, k8sNamespace })

  const workloadParameters = {
    k8sProvider,
    k8sNamespace,
    imageBase,
    imageTag,
    sharedConfig
  }

  createServer(workloadParameters)
  createWeb(workloadParameters)
  createRunner(workloadParameters)
}
