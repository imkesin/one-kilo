# Pulumi Bootstrap

Project-level GCP foundation: APIs, logging config, Artifact Registry, service accounts, and IAM.
Applied locally by a project owner; CI never runs it, so the deploy identity can't grant itself
permissions. `infra/pulumi` reads its outputs via a stack reference.

## Structure (`/src`)

- `main.ts` — APIs, logging, registry, GKE node identity, exported outputs.
- `github-actions.ts` — GitHub OIDC trust (GCP and Pulumi Cloud) and the CI/deploy service accounts.

## Commands

```bash
pnpm build        # tsc
pulumi preview    # dry-run
pulumi up         # apply (as a project owner)
```
