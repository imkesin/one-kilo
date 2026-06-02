# Lib

Cross-cutting utilities shared across apps and libs.

## Structure (`/src`)

- `errors/` — shared tagged errors (e.g. `UnexpectedError`).
- `uuid/` — UUID v7 generation.
- `telemetry/` — tracing helpers.
- `k8s/` — Kubernetes helpers.

## Commands

```bash
pnpm build       # tsc
pnpm test:once   # vitest
```
