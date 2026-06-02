# Server API

HTTP API contract definitions using `@effect/platform` HttpApi.

## Structure (`/src`)

- `modules/` — per-resource API groups (contracts, schemas, errors).
- `infra/` — cross-cutting middleware (e.g. authentication security).
- `internal/` — shared API field helpers.
- `ServerApi.ts` — composes the module groups into the root API.

## Commands

```bash
pnpm build       # tsc
pnpm typecheck   # tsc --build
```
