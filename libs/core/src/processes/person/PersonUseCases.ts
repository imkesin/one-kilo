import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import * as PersonWorkflows from "@one-kilo/workflow/PersonsWorkflowDefinitions"
import * as Effect from "effect/Effect"

type RenamePersonParameters = {
  readonly personId: PersonId
  readonly workosUserId: WorkOSIds.UserId
  readonly firstName: string
  readonly lastName: string
  readonly performedByUserId: UserId
}

export class PersonUseCases extends Effect.Service<PersonUseCases>()(
  "@one-kilo/core/PersonUseCases",
  {
    effect: Effect.succeed({
      renamePerson: Effect.fn("PersonUseCases.renamePerson")(
        function*(params: RenamePersonParameters) {
          // 1. Local DB update (transactional).
          //    TODO: extend PersonsRepository with an `updateNames` method and call it here.

          // 2. Enqueue the WorkOS sync workflow. `discard: true` returns the
          //    execution id without awaiting completion — the runner picks it up.
          yield* PersonWorkflows.SyncPersonToWorkOS.execute({
            personId: params.personId,
            workosUserId: params.workosUserId,
            firstName: params.firstName,
            lastName: params.lastName
          }, { discard: true })
        }
      )
    })
  }
) {}
