import { updateWorkOSUserActivity } from "@one-kilo/core/activities/WorkOSPushActivities"
import { UsersQueryModule } from "@one-kilo/core/modules/users/UsersQueryModule"
import { WorkflowSuspensionsCreationModule } from "@one-kilo/core/modules/workflow-suspensions/WorkflowSuspensionsCreationModule"
import { PushWorkOSUserChange } from "@one-kilo/workflow/WorkOSPushWorkflowsDefinitions"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as WorkflowExtensions from "./WorkflowExtensions.ts"

export const PushWorkOSUserChangeLive = pipe(
  PushWorkOSUserChange.toLayer(
    Effect.fn("PushWorkOSUserChange.execute")(
      function*(payload) {
        const _outcome = yield* updateWorkOSUserActivity({
          workosUserId: payload.workosUserId,
          expected: payload.expected
        })
      },
      WorkflowExtensions.withRecordSuspensionOnFailure
    )
  ),
  Layer.provide([
    UsersQueryModule.Default,
    WorkflowSuspensionsCreationModule.Default
  ])
)
