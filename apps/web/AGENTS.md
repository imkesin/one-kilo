# Web

TanStack Start (TanStack Router + Nitro, built with Vite) on React 19 (React Compiler enabled).
Effect for all server/business logic, Panda CSS for styling, Ariakit for primitives, WorkOS AuthKit
for auth.

## Routing

File-based routes under `src/routes`. Conventions:

- **Route groups / layouts**:
  - `index.tsx` = public home (marketing).
  - `(auth)` = sign-in flow (`sign-in`, `sign-in.callback`).
  - `(health)` = probes (`livez`).
  - `_app` = pathless layout gating the authenticated zone. `ssr: "data-only"` + a `beforeLoad` that
    calls the `getAuthSession` server fn and 302s to `/sign-in` when unauthenticated (no auth flash,
    same gate on hard load and client nav).
  - `api.$.tsx` = catch-all serving the Effect `HttpApi` (`WebApi`) as a web handler.
- **Server route handlers**: export `Route.server.handlers.{GET,POST,…}`. Run Effects with
  `runWithWebServerRuntime()` (see below).

## Effect runtimes

Two distinct runtimes — never mix:

- **Server**: `getManagedWebServerRuntime()` (`~/infra/runtime/server/`) holds a process-global
  `ManagedRuntime` built from `WebServerLive` (disposed on SIGTERM/SIGINT). Route handlers and
  server functions execute via `runWithWebServerRuntime(effect)`, which maps failures: a
  `RedirectError` is rethrown as its TanStack `redirect`, anything else surfaces as
  `UnexpectedError`.
- **Client**: `makeAtomRuntime` (`~/infra/runtime/client/atomRuntime.ts`) via
  `@effect-atom/atom-react` for browser-side Effects.

`WebServerLive` (`webServerLayer.ts`) composes the web modules, the WorkOS public API client, and a
pretty logger. Add server dependencies there.

## HTTP APIs

- `WebApi` (`~/infra/api/WebApi.ts`) — this app's own `HttpApi`, prefixed `/api`, served by
  `api.$.tsx`.
- `WebApiClient` — browser-side client for `WebApi` (fetch).
- `ServerApiClients` (`~/infra/api/server/`) — server-side clients calling the **`server` app** over
  HTTP (Node undici). These are in-cluster service-to-service calls.

## Auth

WorkOS AuthKit, JWT session in an httpOnly cookie:

- `/sign-in` builds the authorization URL and redirects to WorkOS.
- `/sign-in/callback` exchanges the code; `AuthenticationWebModule` mints the session cookie.
- `getAuthSession` (server fn) reads the cookie server-side and projects a **non-secret**
  `AuthSession` (`userId` only); WorkOS tokens never leave the server.

## Redirects through the error channel

`RedirectError` (`~/lib/RedirectError.ts`) is a typed `Data.TaggedError` carrying a TanStack
redirect; `runWithWebServerRuntime` converts it back to a thrown redirect. Two constructors:

- `RedirectError.make({ to, params, … })` — in-app navigation to **typed routes**.
- `RedirectError.external({ href, statusCode, … })` — off-router / absolute URLs (e.g. the WorkOS
  auth URL). Non-generic on purpose: it does **not** reference `RegisteredRouter`, which avoids a
  `Route → handler → RedirectError → Route` type-inference cycle. Don't widen it back to the
  router-generic form.

## Base URL configuration

Service base URLs are **explicit config**, never derived from `request.url` (host headers are
attacker-controllable, and in-cluster callers have no incoming request). Convention:
`{SERVICE}_{AUDIENCE}_BASE_URL`, audience ∈ `PUBLIC | INTERNAL`.

- **PUBLIC** — ingress origin reachable by browsers / WorkOS / emails. `https`, implicit 443. e.g.
  `WEB_PUBLIC_BASE_URL` for OAuth `redirect_uri`s and absolute links.
- **INTERNAL** — cluster DNS for pod-to-pod calls. `http`, explicit service port. e.g. a server's
  `*_INTERNAL_BASE_URL` for web→server calls.

A service knows its own PUBLIC url and the INTERNAL url of every service it calls. Read with
`Config.url(...)` + a localhost `Config.withDefault` for dev (where public == internal ==
localhost). Cluster values are injected by Pulumi (PUBLIC from Ingress, INTERNAL from `Service`).

Current vars: `WEB_PUBLIC_BASE_URL` (web's own origin), `SERVER_INTERNAL_BASE_URL` (web→server, in
`ServerApiClients`).

## Styling & components

- **Panda CSS** — import from `~/generated/styled-system`. Recipes in `src/ui/theme/recipes/`,
  tokens/utilities in `src/ui/theme/`. Run `pnpm prepare` after any `panda.config.ts` change.
- **Components** — wrap Ariakit primitives with Panda recipes in `src/ui/components/`. `templates/`
  are layout shells; `src/content/home/` is marketing content.
- Fonts (Fira Sans/Mono) self-hosted via `@fontsource`, imported in `__root.tsx`.

## Path alias

`~/*` maps to `./src/*`.

## Commands

```bash
pnpm dev       # Vite dev server on :11000
pnpm build     # vite build (Nitro output in .output/)
pnpm start     # node .output/server/index.mjs
pnpm prepare   # Panda CSS codegen
pnpm typecheck # tsc --noEmit
pnpm clean     # rm .output .turbo .tanstack
```
