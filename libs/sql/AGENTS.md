# SQL

Database layer on `@effect/sql` + `@effect/sql-pg` (PostgreSQL).

## Key Patterns

- **Models**: Extend `Model.Class` in `src/modules/{name}/{Name}Model.ts`. Spread `...ModelAuditFields` for standard audit columns (createdAt/By, updatedAt/By, archivedAt).
- **Repositories**: Effect Services in `src/modules/{name}/{Name}Repository.ts`. Use `SqlSchema.single/many()` with template literal SQL.
- **Naming**: camelCase in TypeScript auto-converts to snake_case for SQL and vice versa.

## Commands

```bash
pnpm build       # tsc
pnpm typecheck   # tsc --build
```
