# Monorepo Root

## Structure

- `apps/` - Executable applications
- `infra/` - Infrastructure definitions (e.g., Pulumi, k8s)
- `libs/` - Internal shared libraries (consumed by `apps/`, not published)
- `packages/` - Publishable standalone packages (e.g., `@effect/auth-workos`)
- `scripts/` - Developer tooling and local environment scripts (e.g., `local-dev`)
- `specs/` - Additional guidelines (see Specs index below)

## Specs

`specs/` holds detailed guidelines for the entire repo, organized by topic. Before starting a task,
list `specs/` and read any file whose path looks relevant to the work. Treat these as authoritative.

## Tooling

- `pnpm` - Package manager

## Top-Level Commands

```bash
pnpm build     # Build all packages
pnpm test:once # Run tests
pnpm typecheck # Type check
pnpm lint      # Lint (includes formatting via dprint)
```
