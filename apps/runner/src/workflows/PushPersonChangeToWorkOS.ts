import { updateWorkOSUserActivity } from "@one-kilo/core/activities/UpdateWorkOSUserActivity"
import { PersonsQueryModule } from "@one-kilo/core/modules/persons/PersonsQueryModule"
import { WorkflowSuspensionsCreationModule } from "@one-kilo/core/modules/workflow-suspensions/WorkflowSuspensionsCreationModule"
import * as PushPersonChangeToWorkOSDefinition from "@one-kilo/workflow/PushPersonChangeToWorkOSDefinition"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Match from "effect/Match"
import * as WorkflowExtensions from "./WorkflowExtensions.ts"

const WorkflowLayerWithoutDependencies = PushPersonChangeToWorkOSDefinition.Workflow.toLayer(
  Effect.fn("PushPersonChangeToWorkOS.execute")(
    function*({ personId, expected }) {
      const activityOutcome = yield* pipe(
        updateWorkOSUserActivity({ personId, expected }),
        Effect.catchTags({
          "AccountNotLinkedError": () => Effect.succeed({ _tag: "AccountUnlinked" as const }),
          /*
           * Another actor mutated the WorkOS user since enqueue. The inbound `user.updated`
           * event/webhook should reconcile local state.
           */
          "WorkOSUserStateDriftError": () => Effect.succeed({ _tag: "DriftDetected" as const })
        }),
        Effect.catchTags({
          "RetryBudgetExhaustedError": (e) =>
            PushPersonChangeToWorkOSDefinition.WorkflowError.make({
              cause: e,
              reason: "RetryExhausted"
            }),

          "TargetedPersonNotFoundError": (e) =>
            PushPersonChangeToWorkOSDefinition.WorkflowError.make({
              cause: e,
              reason: "Unexpected"
            }),

          "WorkOSUserNotFoundError": (e) =>
            PushPersonChangeToWorkOSDefinition.WorkflowError.make({
              cause: e,
              reason: "Unexpected"
            }),

          "WorkOSOperationError": (e) =>
            PushPersonChangeToWorkOSDefinition.WorkflowError.make({
              cause: e,
              reason: "Unexpected"
            })
        })
      )

      return PushPersonChangeToWorkOSDefinition.WorkflowSuccess.make({
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
)

export const WorkflowLayer = pipe(
  WorkflowLayerWithoutDependencies,
  Layer.provide([
    PersonsQueryModule.Default,
    WorkflowSuspensionsCreationModule.Default
  ])
)
