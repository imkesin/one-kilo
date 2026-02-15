# Domain

Core domain entities, branded IDs, and context tags.

## Key Patterns

- **Entities**: Effect Schema `TaggedClass` in `src/entities/`. Fields use branded domain IDs.
- **IDs**: Branded UUIDs in `src/ids/` via `Schema.brand()`. Each has a prefixed variant (`u_`, `w_`) and a bidirectional `{Id}FromPrefixed` transform for APIs.

## Commands

```bash
pnpm build       # tsc
pnpm typecheck   # tsc --build
```
