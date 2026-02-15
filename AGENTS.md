# One Kilo - Monorepo Guide

## Structure

- `apps/` - Executable applications
- `infra/` - Infrastructure definitions (e.g., Pulumi, k8s)
- `libs/` - Internal shared libraries (consumed by `apps/`, not published)
- `packages/` - Publishable standalone packages (e.g., `@effect/auth-workos`)

## Top-Level Commands

```bash
pnpm build     # Build all packages
pnpm test:once # Run tests
pnpm typecheck # Type check
pnpm lint      # Lint (includes formatting via dprint)
```