import * as K8s from "@pulumi/kubernetes"
import * as Pulumi from "@pulumi/pulumi"
import { appLabels, type SharedConfig } from "./shared-config.js"

export type CreateRunnerParameters = {
  readonly k8sProvider: K8s.Provider
  readonly k8sNamespace: K8s.core.v1.Namespace
  readonly imageBase: Pulumi.Output<string>
  readonly imageTag: string
  readonly sharedConfig: SharedConfig
}

const RUNNER_PORT = 12000
const RUNNER_SELECTOR = { app: "runner" } as const
const RUNNER_LABELS = appLabels("runner")

export function createRunner({
  k8sProvider,
  k8sNamespace,
  imageBase,
  imageTag,
  sharedConfig
}: CreateRunnerParameters) {
  const serviceAccount = new K8s.core.v1.ServiceAccount(
    "runner",
    {
      metadata: { name: "runner", namespace: k8sNamespace.metadata.name }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  const role = new K8s.rbac.v1.Role(
    "runner-pod-reader",
    {
      metadata: { name: "runner-pod-reader", namespace: k8sNamespace.metadata.name },
      rules: [{
        apiGroups: [""],
        resources: ["pods"],
        verbs: ["get", "list", "watch"]
      }]
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  const _roleBinding = new K8s.rbac.v1.RoleBinding(
    "runner-pod-reader",
    {
      metadata: { name: "runner-pod-reader", namespace: k8sNamespace.metadata.name },
      subjects: [{
        kind: "ServiceAccount",
        name: serviceAccount.metadata.name,
        namespace: k8sNamespace.metadata.name
      }],
      roleRef: {
        kind: "Role",
        name: role.metadata.name,
        apiGroup: "rbac.authorization.k8s.io"
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  const headlessService = new K8s.core.v1.Service(
    "runner-headless",
    {
      metadata: { name: "runner-headless", namespace: k8sNamespace.metadata.name },
      spec: {
        clusterIP: "None",
        publishNotReadyAddresses: true,
        selector: RUNNER_SELECTOR,
        ports: [{ name: "cluster", port: RUNNER_PORT, targetPort: RUNNER_PORT }]
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )

  const _statefulSet = new K8s.apps.v1.StatefulSet(
    "runner",
    {
      metadata: { namespace: k8sNamespace.metadata.name },
      spec: {
        serviceName: headlessService.metadata.name,
        replicas: 1,
        podManagementPolicy: "Parallel",
        selector: { matchLabels: RUNNER_SELECTOR },
        template: {
          metadata: { labels: RUNNER_LABELS },
          spec: {
            serviceAccountName: serviceAccount.metadata.name,
            terminationGracePeriodSeconds: 60,
            containers: [{
              name: "runner",
              image: Pulumi.interpolate`${imageBase}/runner:${imageTag}`,
              ports: [{ name: "cluster", containerPort: RUNNER_PORT }],
              env: [
                {
                  name: "POD_NAME",
                  valueFrom: { fieldRef: { fieldPath: "metadata.name" } }
                },
                {
                  name: "POD_NAMESPACE",
                  valueFrom: { fieldRef: { fieldPath: "metadata.namespace" } }
                },
                {
                  name: "RUNNER_HOST",
                  value: "$(POD_NAME).runner-headless.$(POD_NAMESPACE).svc.cluster.local"
                },
                { name: "RUNNER_PORT", value: String(RUNNER_PORT) },
                { name: "RUNNER_K8S_NAMESPACE", value: "$(POD_NAMESPACE)" },
                { name: "RUNNER_K8S_LABEL_SELECTOR", value: "app=runner" }
              ],
              envFrom: [
                { configMapRef: { name: sharedConfig.workosConfigMap.metadata.name } },
                { secretRef: { name: sharedConfig.workosApiKeySecret.metadata.name } },
                { configMapRef: { name: sharedConfig.postgresConfigMap.metadata.name } },
                { secretRef: { name: sharedConfig.postgresPasswordSecret.metadata.name } }
              ],
              resources: {
                requests: { cpu: "250m", memory: "256Mi" },
                limits: { cpu: "1000m", memory: "1Gi" }
              },
              startupProbe: {
                tcpSocket: { port: RUNNER_PORT },
                periodSeconds: 5,
                failureThreshold: 12
              },
              livenessProbe: {
                tcpSocket: { port: RUNNER_PORT },
                periodSeconds: 30
              },
              readinessProbe: {
                tcpSocket: { port: RUNNER_PORT },
                periodSeconds: 15
              }
            }]
          }
        }
      }
    },
    { provider: k8sProvider, dependsOn: [k8sNamespace] }
  )
}
