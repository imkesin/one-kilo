import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as SqlClient from "effect/sql/SqlClient"
import * as SqlSchemaExtensions from "../../utils/SqlSchemaExtensions.ts"
import { WorkflowSuspensionsModel } from "./WorkflowSuspensionsModel.ts"

type InsertWorkflowSuspensionParameters = {
  readonly executionId: string
  readonly workflowName: string
}

export class WorkflowSuspensionsRepository extends Context.Service<WorkflowSuspensionsRepository>()(
  "@one-kilo/sql/WorkflowSuspensionsRepository",
  {
    make: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchemaExtensions.findOneWithRequestDefaults({
        Request: WorkflowSuspensionsModel.insert,
        Result: WorkflowSuspensionsModel.select,
        execute: (request) => sql`INSERT INTO workflow_suspensions ${sql.insert(request).returning("*")}`
      })

      const insert = Effect.fn("WorkflowSuspensionsRepository.insert")(
        function*({
          executionId,
          workflowName
        }: InsertWorkflowSuspensionParameters) {
          yield* Effect.flatMap(
            idGenerator.workflowSuspensionId,
            (workflowSuspensionId) =>
              insertSchema({
                id: workflowSuspensionId,
                executionId,
                workflowName,
                occurredAt: undefined,
                resumedAt: undefined,
                dismissedAt: undefined
              })
          )
        },
        orDieWithUnexpectedError("Failed to insert workflow suspension")
      )

      return { insert }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(DomainIdGenerator.layer)
  )
}
