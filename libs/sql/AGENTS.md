# SQL

Database layer on `@effect/sql` + `@effect/sql-pg` (PostgreSQL).

## Structure (`/src`)

- `configs/` — connection defaults.
- `migrations/` — ordered, numbered schema migrations.
- `modules/` — per-aggregate models and repositories.
- `utils/` — model field/extension helpers.

## Specs

`specs/` holds detailed guidelines for working with SQL, Before starting a task, list `specs/` and
read any file whose path looks relevant to the work. Treat these as authoritative.

## Commands

```bash
pnpm build       # tsc
pnpm test:once   # vitest
pnpm typecheck   # tsc --build
```
