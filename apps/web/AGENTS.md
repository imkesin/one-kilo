# Web

TanStack Start (Router + Nitro via Vite) on React 19 (Compiler enabled). Effect for all
server/business logic, Panda CSS for styling, Ariakit primitives, WorkOS AuthKit for auth.

## Structure (`/src`)

- `routes/` — file-based routes (see Routing). Thin: routing, loaders, server fns, composition. No
  UI defined here.
- `infra/` — app wiring: HTTP APIs, clients, and Effect runtimes.
- `modules/` — server-side feature logic (the client-UI counterpart is `ui/features/`).
- `lib/` — app utilities.
- `ui/` — all UI + theme (Ariakit + Panda). Two tiers by coupling:
  - `ui/components/` — pure, portable primitives. Pure by convention: no router, no atoms, no
    feature data. A piece earns its way down here only once reused and proven generic.
  - `ui/features/<area>/` — app-wired, feature-scoped UI. May import the router/atoms; composes
    primitives; colocates its own sub-components and route/data wiring. Reusable across routes.
  - `ui/generated/` — Panda codegen (styled-system); do not edit.
- `styles/` — global CSS.

## Routing

File-based under `src/routes`:

- `index.tsx` — public marketing home.
- `(auth)` — sign-in flow.
- `(health)` — probes.
- `_app` — gates the authenticated zone.
- `api.$.tsx` — serves the Effect `HttpApi` under `/api`.

## Effect runtimes

Two runtimes, never mix:

- **Server** — `getManagedWebServerRuntime()` (`~/infra/runtime/server/`); run effects via
  `runWithWebServerRuntime()`.
- **Client** — `makeAtomRuntime` (`~/infra/runtime/client/`) for browser effects.

## Commands

```bash
pnpm dev       # Vite dev server on :11000
pnpm build     # vite build (Nitro output in .output/)
pnpm start     # node .output/server/index.mjs
pnpm prepare   # Panda CSS codegen
pnpm typecheck # tsc --noEmit
pnpm clean     # rm .output .turbo .tanstack
```
