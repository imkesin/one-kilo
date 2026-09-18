import { updateWorkOSUserActivity } from "@one-kilo/core/activities/UpdateWorkOSUserActivity"
import { PersonsQueryModule } from "@one-kilo/core/modules/persons/PersonsQueryModule"
import { WorkflowSuspensionsCreationModule } from "@one-kilo/core/modules/workflow-suspensions/WorkflowSuspensionsCreationModule"
import {
  PushPersonChangeToWorkOSError,
  PushPersonChangeToWorkOSSuccess,
  PushPersonChangeToWorkOSWorkflow
} from "@one-kilo/workflow/PushPersonChangeToWorkOSWorkflowDefinitions"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Match from "effect/Match"
import * as WorkflowExtensions from "./WorkflowExtensions.ts"

export const PushPersonChangeToWorkOSWorkflowLive = pipe(
  PushPersonChangeToWorkOSWorkflow.toLayer(
    Effect.fn("PushPersonChangeToWorkOSWorkflow.execute")(
      function*(payload) {
        const activityOutcome = yield* pipe(
          updateWorkOSUserActivity({
            personId: payload.personId,
            expected: payload.expected
          }),
          Effect.catchTags({
            /*
             * The account was unlinked between enqueue and run, so there is no longer a WorkOS user
             * to update. Nothing to reconcile.
             */
            "AccountNotLinkedError": () => Effect.succeed({ _tag: "AccountUnlinked" as const }),

            /*
             * Drift means another actor (the WorkOS dashboard, another sync, etc.) mutated the
             * user since this workflow was scheduled. Abort rather than clobber their change —
             * the inbound `user.updated` webhook will reconcile our local state back to WorkOS.
             */
            "WorkOSUserStateDriftError": () => Effect.succeed({ _tag: "DriftDetected" as const })
          }),
          Effect.catchTags({
            "RetryBudgetExhaustedError": (e) =>
              PushPersonChangeToWorkOSError.make({
                cause: e,
                reason: "RetryExhausted"
              }),

            "TargetedPersonNotFoundError": (e) =>
              PushPersonChangeToWorkOSError.make({
                cause: e,
                reason: "Unexpected"
              }),

            "WorkOSUserNotFoundError": (e) =>
              PushPersonChangeToWorkOSError.make({
                cause: e,
                reason: "Unexpected"
              }),

            "WorkOSOperationError": (e) =>
              PushPersonChangeToWorkOSError.make({
                cause: e,
                reason: "Unexpected"
              })
          })
        )

        return PushPersonChangeToWorkOSSuccess.make({
          outcome: Match.valueTags(
            activityOutcome,
            {
              "AccountUnlinked": () => "AccountUnlinked" as const,
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
    PersonsQueryModule.Default,
    WorkflowSuspensionsCreationModule.Default
  ])
)
