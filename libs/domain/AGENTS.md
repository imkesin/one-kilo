# Domain

The core domain model: entities, IDs, values, and the rules over them.

## Structure (`/src`)

- `audit-logs/` — audit log definitions per aggregate.
- `authorization/` — policies, permissions, and roles.
- `entities/` — domain entities (Effect Schema).
- `errors/` — domain errors, grouped per aggregate.
- `ids/` — branded UUID IDs with prefixed variants.
- `tags/` — Effect context tags (e.g. `Actor`).
- `values/` — value objects and derived values.

## Commands

```bash
pnpm build       # build `src/` to `dist/`
pnpm test:once   # unit tests
pnpm typecheck   # typecheck `src/` and `test/`
```
