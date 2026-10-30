# Database | Aggregate versions

Every aggregate table (all action records, not `audit_logs`) carries:

```sql
version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
```

- The model field is `Model.GeneratedByDb(<Entity>Version)`: inserts take the default, and the
  domain entity carries the branded version (`@one-kilo/domain/versions/*`).
- Every committed change bumps it by exactly 1. No-op updates (nothing changed) don't write, so they
  don't bump.

## Updates

Read the entity first, then guard the write with the version that was read:

```sql
UPDATE persons
SET ${sql.update(fields)}, version = version + 1
WHERE id = ${id} AND version = ${version}
RETURNING *
```

- Repository `update` takes the read entity, not a bare ID.
- No row returned → die. Writes run in SERIALIZABLE transactions, where a concurrent write raises a
  serialization failure (retried) rather than matching 0 rows, so a miss means a bug.

## Why

- Optimistic concurrency without trusting the transaction isolation level alone.
- A per-aggregate sequence that audit log targets and outbound events can reference.
