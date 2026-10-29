# Pulumi Bootstrap

Project-level GCP foundation: APIs, logging config, Artifact Registry, service accounts, and IAM.
Applied locally by a project owner; CI never runs it, so the CI identity can't grant itself
permissions. `infra/pulumi` reads its outputs via a stack reference.

## Structure (`/src`)

- `main.ts` — APIs, logging, registry, GKE node identity, exported outputs.
- `github-actions.ts` — GitHub OIDC trust and the CI service account.

## Commands

```bash
pnpm build        # tsc
pulumi preview    # dry-run
pulumi up         # apply (as a project owner)
```
