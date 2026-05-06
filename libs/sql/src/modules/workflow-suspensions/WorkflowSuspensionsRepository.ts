import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { WorkflowSuspensionsModel } from "./WorkflowSuspensionsModel.ts"

type InsertWorkflowSuspensionParameters = {
  readonly executionId: string
  readonly workflowName: string
}

export class WorkflowSuspensionsRepository extends Effect.Service<WorkflowSuspensionsRepository>()(
  "@one-kilo/sql/WorkflowSuspensionsRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
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
) {}
