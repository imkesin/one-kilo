import { updateWorkOSUserActivity } from "@one-kilo/core/activities/UpdateWorkOSUserActivity"
import { UsersQueryModule } from "@one-kilo/core/modules/users/UsersQueryModule"
import { WorkflowSuspensionsCreationModule } from "@one-kilo/core/modules/workflow-suspensions/WorkflowSuspensionsCreationModule"
import {
  PushWorkOSUserChangeError,
  PushWorkOSUserChangeSuccess,
  PushWorkOSUserChangeWorkflow
} from "@one-kilo/workflow/PushWorkOSUserChangeWorkflowDefinitions"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Match from "effect/Match"
import * as WorkflowExtensions from "./WorkflowExtensions.ts"

export const PushWorkOSUserChangeWorkflowLive = pipe(
  PushWorkOSUserChangeWorkflow.toLayer(
    Effect.fn("PushWorkOSUserChangeWorkflow.execute")(
      function*(payload) {
        const activityOutcome = yield* pipe(
          updateWorkOSUserActivity({
            workosUserId: payload.workosUserId,
            expected: payload.expected
          }),
          Effect.catchTag(
            "WorkOSUserStateDriftError",
            /*
             * Drift means another actor (the WorkOS dashboard, another sync, etc.) mutated the
             * user since this workflow was scheduled. Abort rather than clobber their change —
             * the inbound `user.updated` webhook will reconcile our local state back to WorkOS.
             */
            () => Effect.succeed({ _tag: "DriftDetected" as const })
          ),
          Effect.catchTags({
            "RetryBudgetExhaustedError": (e) =>
              PushWorkOSUserChangeError.make({
                cause: e,
                reason: "RetryExhausted"
              }),

            "TargetedUserNotFoundError": (e) =>
              PushWorkOSUserChangeError.make({
                cause: e,
                reason: "Unexpected"
              }),

            "WorkOSUserNotFoundError": (e) =>
              PushWorkOSUserChangeError.make({
                cause: e,
                reason: "Unexpected"
              }),

            "WorkOSOperationError": (e) =>
              PushWorkOSUserChangeError.make({
                cause: e,
                reason: "Unexpected"
              })
          })
        )

        return PushWorkOSUserChangeSuccess.make({
          outcome: Match.valueTags(
            activityOutcome,
            {
              "AlreadySyncedOutcome": () => "AlreadySynced" as const,
              "DriftDetected": () => "DriftDetected" as const,
              "UpdatedOutcome": () => "Updated" as const
            }
          )
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
