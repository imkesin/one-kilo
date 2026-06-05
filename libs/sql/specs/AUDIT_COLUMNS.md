# Database | Audit columns

When adding a table, classify each row: is it an **action** someone took, or an **event** the system
observed? The audit columns follow from the answer.

## Action records

Someone decided to do this (Person, Workspace, EmailAddress creations).

- `created_by_user_id`, `updated_by_user_id`, `created_at` — all `NOT NULL`.
- System actors that genuinely write the table are modeled as real users (e.g. a MachineClient user)
  so the FK stays `NOT NULL`.

## Event records

The runner _observed_ the event; it didn't _decide_ it (WorkflowSuspension, webhooks-received,
retries-exhausted, rate-limit-hits, deadletter-arrivals).

- `occurred_at` only. No `created_by`.
- The cause is modeled by domain columns (`execution_id`, `workflow_name`), not an actor FK.

## Why

Avoids two failure modes:

- Inventing a system user just to satisfy a `NOT NULL` audit column on a table no human writes to.
- Nullable `created_by_user_id`, which conflates "missing data", "system actor", and "anonymous"
  into one ambiguous `NULL`.

Never reach for a nullable audit FK. Decide the row type instead.
