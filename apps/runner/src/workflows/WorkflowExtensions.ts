import { Workflow } from "@effect/workflow"
import { WorkflowInstance } from "@effect/workflow/WorkflowEngine"
import { WorkflowSuspensionsCreationModule } from "@one-kilo/core/modules/workflow-suspensions/WorkflowSuspensionsCreationModule"
import * as Effect from "effect/Effect"

const recordSuspension = Effect.fn(
  function*() {
    const workflowSuspensionsCreationModule = yield* WorkflowSuspensionsCreationModule
    const workflowInstance = yield* WorkflowInstance

    if (!workflowInstance.suspended) {
      return
    }

    yield* workflowSuspensionsCreationModule.createWorkflowSuspension({
      executionId: workflowInstance.executionId,
      workflowName: workflowInstance.workflow.name
    })
  }
)

/**
 * If the Workflows exits with a failure (includes `die`) + suspends, save a record
 */
export const withRecordSuspensionOnFailure = Workflow.withCompensation(recordSuspension)
