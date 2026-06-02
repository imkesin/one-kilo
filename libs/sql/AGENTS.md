# SQL

Database layer on `@effect/sql` + `@effect/sql-pg` (PostgreSQL).

## Structure (`/src`)

- `modules/` — per-aggregate models and repositories.
- `migrations/` — ordered, numbered schema migrations.
- `configs/` — connection defaults.
- `utils/` — model field/extension helpers.

## Commands

```bash
pnpm build       # tsc
pnpm test:once   # vitest
pnpm typecheck   # tsc --build
```
