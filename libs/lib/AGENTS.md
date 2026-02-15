# Lib

Shared utilities: error handling and UUID v7 generation.

## Key Patterns

- **UnexpectedError**: `TaggedError` with `message`, optional `cause` and `context`. Use `orDieWithUnexpectedError(msg)` to convert Effect failures.

## Commands

```bash
pnpm build       # tsc
pnpm test:once   # vitest
```
