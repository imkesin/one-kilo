# Web

Next.js 16 App Router with React 19, Panda CSS, and Ariakit.

## Key Patterns

- **Route groups**:
  * `(app)` = authenticated
  * `(auth)` = sign-in flow
  * `(health)` = probes
  * `api` = Effect HttpApi
- **Server-side Effect**:
  * Use `runWithServerRuntime()` from `~/infra/runtime/server/` to run Effects in route handlers/server components.
- **Styling**:
  * Panda CSS — import from `~/generated/styled-system`. Recipes in `src/ui/theme/recipes/`. Run `pnpm prepare` after config changes.
- **Components**:
  * Wrap Ariakit primitives with Panda recipes in `src/ui/components/`.
- **Path alias**:
  * `~/*` maps to `./src/*`.
- **Auth**:
  * WorkOS OAuth via `/sign-in` route. JWT session in HTTP-only cookie.

## Commands

```bash
pnpm dev       # Next.js dev server
pnpm build     # next build (standalone)
pnpm prepare   # Panda CSS codegen
pnpm typecheck # tsc --noEmit
```
