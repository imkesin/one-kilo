# Local Dev

Local development environment scripts. Uses Effect + `effect/process` for shell commands.

## Commands

```bash
pnpm infra:setup # pg:setup + otel:setup
pnpm pg:setup    # Create/start a local Postgres container (postgres:18.2 on port 20000)
pnpm pg:reset    # Truncate all tables in the local database
pnpm otel:setup  # Create/start a local grafana/otel-lgtm container (OTLP HTTP on 21000, Grafana on 21100)
pnpm typecheck   # Type check
```

## Prerequisites

- `docker` must be available on the host machine.

## Notes

- Ports: apps on 10_000s, infra on 20_000s; defaults live in each lib's `configs/Defaults.ts`.
- `*:setup` scripts are idempotent: detect running containers, start stopped ones, or create new
  ones.
