# TypeScript | Test tsconfigs

Test tsconfigs are non-composite (`noEmit: true`, `composite: false`, `declaration: false`) — they
do **not** participate in project references via `composite: true`.

## Why

`Effect.Service` infers deeply nested types that transitively reference things like `Stream`. When
`composite: true` forces declaration emit, TypeScript fails because it can't name those types. Test
declarations are never consumed by anything, so emitting them is pure cost.

## How

- Don't add the test tsconfig to the parent's `references`.
- Type-check tests separately: `tsc --project tsconfig.test.json --noEmit`.
- The test tsconfig may still `references: [tsconfig.src.json]` to access src types.
