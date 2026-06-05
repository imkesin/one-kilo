# Effect | Domain errors

## Grouping

Group domain errors **per aggregate** in one file: `libs/domain/src/errors/PersonErrors.ts`.

## Definition

- `S.TaggedError`, tag `@one-kilo/domain/{Name}`.

```ts
export class PersonNotFoundError extends S.TaggedError<PersonNotFoundError>(
  "@one-kilo/domain/PersonNotFoundError"
)(
  "PersonNotFoundError",
  { personId: PersonId },
  { description: "No person exists for the given identifier." }
) {}
```

## Boundary

Domain errors are transport-agnostic facts. Routes translate them to HTTP (404, etc.) separately.
