# Deploy

Deploys `infra/pulumi` from a developer machine. Uses Effect + `effect/process` for shell commands
and `effect/cli` for arguments.

## Structure (`/src`)

- `deploy.ts` — guards (clean tree, HEAD on `origin/main`, CI images pushed), build, `pulumi up`.

## Commands

```bash
pnpm deploy:dev # Deploy HEAD to the `dev` stack with the images CI pushed for it
pnpm typecheck  # Type check
```

## Prerequisites

- `pulumi login`, `gcloud auth login`, and `gcloud auth application-default login`.
