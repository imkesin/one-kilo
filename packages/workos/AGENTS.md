# WorkOS

Effect-based WorkOS API wrapper, published as `@effect/auth-workos`.

## Key Patterns

- **Clients**: `ApiClient` (REST, requires `apiKey`) and `OAuth2Client` (auth flows, requires `authKitDomain`). Each has a `layerConfig()` for env-driven setup.
- **Gateways**: `ApiGateway` / `OAuth2Gateway` wrapped clients for easier testing.

## Commands

```bash
pnpm build             # tsc
pnpm test:once         # unit tests
pnpm test:integration  # requires live WorkOS keys (use sparingly)
```
