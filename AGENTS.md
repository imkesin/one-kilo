# Effect WorkOS Monorepo Guide

## Structure

- `apps/` - Executable applications
- `libs/` - Internal shared libraries (consumed by `apps/`, not published)
- `packages/` - Publishable standalone packages (e.g., `@effect-workos/workos`)

## Top-Level Commands

```bash
pnpm build     # Build all packages
pnpm test:once # Run tests
pnpm typecheck # Type check
pnpm lint      # Lint (includes formatting via dprint)
```