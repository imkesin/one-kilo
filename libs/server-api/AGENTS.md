# Server API

HTTP API contract definitions using `@effect/platform` HttpApi.

## Key Patterns

- **Adding an endpoint**: Create `src/modules/{name}/{Name}Api.ts` with an `HttpApiGroup`. Define schemas in `{Name}ApiSchemas.ts`. Add errors in `internal/{Name}ApiErrors.ts`. Wire the group into `ServerApi.ts`.
- **API composition**: `ServerApi` composes three sub-APIs:
  * `PublicApi` — unauthenticated (health checks)
  * `AuthenticationApi` — prefixed `/authentication`
  * `ApplicationApi` — guarded by `Authentication` middleware (provides `Actor`)
- **Schemas**: `S.Struct({...})` with `HttpApiSchema.annotations({ status })`.
- **Errors**: Extend `S.TaggedError` with `HttpApiSchema.annotations({ status, description })`.

## Commands

```bash
pnpm build       # tsc
pnpm typecheck   # tsc --build
```
