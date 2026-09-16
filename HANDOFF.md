# Handoff: `users` → `accounts` and follow-ups

Working notes for stepping through the remaining cleanups one at a time. Delete this file when the
list is empty.

## Where things stand

- PR #4 (`refactor/users-to-accounts`) renames our `User` entity to `Account` across `libs/` and
  `apps/`. Migrations were rewritten in place; there is no upgrade path (pre-release).
- **Boundary rule:** anything that refers to a WorkOS User keeps WorkOS's word. `packages/workos`,
  `workosUserId` / `workos_user_id`, `WorkOSIds.UserId`, `userManagement.*`, the `user.updated`
  webhook, and `PushWorkOSUser*` / `UpdateWorkOSUser*` are all intentionally still "user".
- SQL statements use the full `accounts` table name; the `u` alias is gone.

## Local environment after pulling

- Existing local DBs hold the old `users` schema. Drop and recreate `one_kilo_local` and
  `one_kilo_test` (or remove the `local-one-kilo-postgres` container and re-run `pg:setup`).
- If tests fail with `MigrationError: Found duplicate migration id's`, a stale
  `libs/sql/dist/src/migrations/00003_create_users.js` is present. Turbo restores it from cache, so
  `rm -rf libs/sql/dist && pnpm turbo build --filter=@one-kilo/sql --force`.

## Next steps (one PR each, in rough priority order)

1. **Rename `PushWorkOSUserChangeWorkflow` → `PushPersonChangeToWorkOSWorkflow`.** The trigger is a
   `PersonUpdatedAuditLog`, and the name should say source (person change) and direction (to WorkOS)
   to contrast with the inbound `user.updated` webhook. Rename the definitions file in
   `libs/workflow`, the runner layer in `apps/runner`, and the `Success` / `Error` classes. Leave
   `UpdateWorkOSUserActivity` alone; it correctly names the WorkOS-side operation.

2. **Key the workflow payload by `personId` instead of `workosUserId`.** Behavior change, so keep it
   separate from the rename. The activity should resolve person → account → `workosUserId` at run
   time so an account unlinked between enqueue and run aborts cleanly instead of updating a stale
   WorkOS user. The expected-state drift check (`WorkOSUserStateDriftError`) already exists and
   stays as-is.

3. **Replace the remaining short SQL aliases with full table names** for consistency with
   `accounts`: `p` (persons), `mc` (machine_clients), `wsm` (workspace_memberships), `ws`
   (workspaces), `ea` (email_addresses), `coa` (coaches), `cr` (coaching_relationships). Update the
   `asJsonBBuildObject` alias defaults in each `*Model.ts` at the same time.

4. **Lengthen the remaining prefixed-ID prefixes** to match `account_`: `p_`, `mcli_`, `ws_`,
   `wsm_`, `ath_`, `coa_`, `cr_`, `ea_`, `al_`. Note `ws_` is currently used by both `WorkspaceId`
   and `WorkflowSuspensionId`; the longer form fixes that collision. Consider aligning the SQL
   constraint/index prefixes (`fk_wm_`, `idx_ws_`, …) in the same pass.

5. **Decide the shape of the whoami endpoint.** `GET /accounts/me` is correct while it returns only
   `{ account }`. If it grows to include workspace and role (the full `ActorIdentity`), move it to a
   top-level `GET /me` or `/session` rather than widening the accounts endpoint.

6. **`@one-kilo/core` has no test files**, so `pnpm test:once` fails on it. Either add a first test
   or pass `--passWithNoTests` in its `test:once` script.

## Verification checklist per step

```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm test:once
```

DB-backed suites (`@one-kilo/sql`, `@one-kilo/server`) need the local Postgres container running on
port 20000.
