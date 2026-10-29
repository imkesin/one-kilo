# Pulumi

Pulumi IaC for the GKE cluster and Kubernetes workloads, deployed locally via `scripts/deploy`.
Project-level foundation (APIs, logging, registry, service accounts, IAM) lives in
`infra/pulumi-bootstrap`, read via a stack reference; never add IAM grants here.

## Commands

```bash
pnpm build        # tsc
pulumi preview    # dry-run
pulumi up         # avoid: deploys image-tag `latest`; use `scripts/deploy` instead
```
