# Server

Effect HTTP server using `@effect/platform`.

## Key Patterns

- **Adding an endpoint**: Define the API group/endpoint in `libs/server-api` first, then implement the handler here in `src/modules/{name}/{Name}Http.ts` using `HttpApiBuilder.group(ServerApi, "groupName", ...)`.
- **Layer composition**: All dependencies wired in `src/Http.ts` via `HttpApiBuilder.api(ServerApi)`. Add new handler layers there.

## Commands

```bash
pnpm build       # tsc
pnpm dev         # dev entrypoint
pnpm test:once   # vitest
```
