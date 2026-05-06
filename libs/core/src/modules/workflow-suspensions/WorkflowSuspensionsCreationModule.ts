import { WorkflowSuspensionsRepository } from "@one-kilo/sql/modules/workflow-suspensions/WorkflowSuspensionsRepository"
import * as Effect from "effect/Effect"

type CreateWorkflowSuspensionParameters = {
  readonly executionId: string
  readonly workflowName: string
}

export class WorkflowSuspensionsCreationModule extends Effect.Service<WorkflowSuspensionsCreationModule>()(
  "@one-kilo/core/WorkflowSuspensionsCreationModule",
  {
    dependencies: [WorkflowSuspensionsRepository.Default],
    effect: Effect.gen(function*() {
      const workflowSuspensionsRepository = yield* WorkflowSuspensionsRepository

      const createWorkflowSuspension = Effect.fn("WorkflowSuspensionsCreationModule.createWorkflowSuspension")(
        function*(params: CreateWorkflowSuspensionParameters) {
          yield* workflowSuspensionsRepository.insert({
            executionId: params.executionId,
            workflowName: params.workflowName
          })
        }
      )

      return { createWorkflowSuspension }
    })
  }
) {}
