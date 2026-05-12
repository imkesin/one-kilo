import { updateWorkOSUserActivity } from "@one-kilo/core/activities/UpdateWorkOSUserActivity"
import { UsersQueryModule } from "@one-kilo/core/modules/users/UsersQueryModule"
import { WorkflowSuspensionsCreationModule } from "@one-kilo/core/modules/workflow-suspensions/WorkflowSuspensionsCreationModule"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { PushWorkOSUserChange } from "@one-kilo/workflow/PushWorkOSUserChangeWorkflowDefinitions"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as WorkflowExtensions from "./WorkflowExtensions.ts"

export const PushWorkOSUserChangeLive = pipe(
  PushWorkOSUserChange.toLayer(
    Effect.fn("PushWorkOSUserChange.execute")(
      function*(payload) {
        const _outcome = yield* pipe(
          updateWorkOSUserActivity({
            workosUserId: payload.workosUserId,
            expected: payload.expected
          }),
          orDieWithUnexpectedError("[TODO] No proper handling yet")
        )
      },
      WorkflowExtensions.withRecordSuspensionOnFailure
    )
  ),
  Layer.provide([
    UsersQueryModule.Default,
    WorkflowSuspensionsCreationModule.Default
  ])
)
