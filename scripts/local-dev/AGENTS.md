# local-dev

Local development environment scripts. Uses Effect + `@effect/platform` for shell commands.

## Scripts

```bash
pnpm pg:setup   # Create/start a local Postgres container (postgres:18.2 on port 5432)
pnpm typecheck  # Type check
```

## Notes

- `pg:setup` is idempotent: detects running containers, starts stopped ones, or creates new ones.
