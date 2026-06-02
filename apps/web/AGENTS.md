# Web

TanStack Start (Router + Nitro via Vite) on React 19 (Compiler enabled). Effect for all
server/business logic, Panda CSS for styling, Ariakit primitives, WorkOS AuthKit for auth.

## Structure (`/src`)

- `routes/` — file-based routes (see Routing).
- `infra/` — app wiring: HTTP APIs, clients, and Effect runtimes.
- `modules/` — server-side feature logic.
- `lib/` — app utilities.
- `ui/` — components and theme (Ariakit + Panda).
- `content/` — marketing content.
- `generated/` — Panda codegen; do not edit.
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
  `runWithWebServerRuntime()`. Add server deps to `WebServerLive`.
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
