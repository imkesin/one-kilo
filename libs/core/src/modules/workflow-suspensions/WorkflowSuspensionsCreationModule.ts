import { WorkflowSuspensionsRepository } from "@one-kilo/sql/modules/workflow-suspensions/WorkflowSuspensionsRepository"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

type CreateWorkflowSuspensionParameters = {
  readonly executionId: string
  readonly workflowName: string
}

export class WorkflowSuspensionsCreationModule extends Context.Service<WorkflowSuspensionsCreationModule>()(
  "@one-kilo/core/WorkflowSuspensionsCreationModule",
  {
    make: Effect.gen(function*() {
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
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(WorkflowSuspensionsRepository.layer)
  )
}
