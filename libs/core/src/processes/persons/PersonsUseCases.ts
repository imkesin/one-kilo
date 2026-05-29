import * as PgClient from "@effect/sql-pg/PgClient"
import type { PersonEntity } from "@one-kilo/domain/entities/Person"
import { PersonNotFoundError } from "@one-kilo/domain/errors/PersonErrors"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as PgClientExtensions from "@one-kilo/sql/utils/PgClientExtensions"
import { PushWorkOSUserChangeWorkflow } from "@one-kilo/workflow/PushWorkOSUserChangeWorkflowDefinitions"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import { PersonsManagementModule } from "../../modules/persons/PersonsManagementModule.ts"
import { PersonsQueryModule } from "../../modules/persons/PersonsQueryModule.ts"

type UpdatePersonFields = {
  readonly preferredName?: PreferredName
  readonly fullName?: FullName
}

type UpdatePersonParameters = {
  readonly personId: PersonId
  readonly fields: UpdatePersonFields
}

type UpdatePersonOutcome = Data.TaggedEnum<{
  Unchanged: { readonly person: PersonEntity }
  Updated: { readonly person: PersonEntity }
}>
const UpdatePersonOutcome = Data.taggedEnum<UpdatePersonOutcome>()

export class PersonsUseCases extends Effect.Service<PersonsUseCases>()(
  "@one-kilo/core/PersonsUseCases",
  {
    dependencies: [
      PersonsManagementModule.Default,
      PersonsQueryModule.Default
    ],
    effect: Effect.gen(function*() {
      const pg = yield* PgClient.PgClient

      const personsManagementModule = yield* PersonsManagementModule
      const personsQueryModule = yield* PersonsQueryModule

      const update = Effect.fn("PersonsUseCases.update")(
        function*({ personId, fields }: UpdatePersonParameters) {
          const {
            person: beforePerson,
            maybeUser
          } = yield* pipe(
            personsQueryModule.retrievePersonWithUser({ personId }),
            Effect.flatMap(
              Option.match({
                onNone: () => PersonNotFoundError.make({ personId }),
                onSome: Effect.succeed
              })
            )
          )

          const updatePersonOutcome = yield* personsManagementModule.updatePerson(beforePerson, fields)

          if (updatePersonOutcome._tag === "Unchanged") {
            return UpdatePersonOutcome.Unchanged({ person: updatePersonOutcome.person })
          }

          const { person: updatedPerson, auditLog } = updatePersonOutcome

          if (Option.isSome(maybeUser)) {
            const user = maybeUser.value

            const beforeWorkOsName = yield* pipe(
              beforePerson.deriveWorkOSName(),
              orDieWithUnexpectedError("Failed to derive a WorkOS name from the before-state person")
            )

            yield* PushWorkOSUserChangeWorkflow.execute(
              {
                causedByAuditLogId: auditLog.id,
                expected: {
                  firstName: beforeWorkOsName.firstName,
                  lastName: beforeWorkOsName.lastName
                },
                workosUserId: user.workosUserId
              },
              { discard: true }
            )
          }

          return UpdatePersonOutcome.Updated({ person: updatedPerson })
        },
        PgClientExtensions.withSerializableTransaction(pg)
      )

      return { update }
    })
  }
) {}
