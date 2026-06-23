import * as PgClient from "@effect/sql-pg/PgClient"
import * as PersonPolicies from "@one-kilo/domain/authorization/PersonPolicies"
import * as Policy from "@one-kilo/domain/authorization/Policy"
import type { AthleteEntity } from "@one-kilo/domain/entities/Athlete"
import { PersonNotFoundError } from "@one-kilo/domain/errors/PersonErrors"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { Actor } from "@one-kilo/domain/tags/Actor"
import { AthletesQueryRepository } from "@one-kilo/sql/modules/athletes/AthletesQueryRepository"
import { PersonsQueryRepository } from "@one-kilo/sql/modules/persons/PersonsQueryRepository"
import * as PgClientExtensions from "@one-kilo/sql/utils/PgClientExtensions"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import { AthletesCreationModule } from "../../modules/athletes/AthletesCreationModule.ts"

type RegisterAthleteParameters = {
  personId: PersonId
}

type EnsureAthleteParameters = {
  personId: PersonId
  performedByUserId: UserId
}

export type RegisterAthleteOutcome = Data.TaggedEnum<{
  Registered: { readonly athlete: AthleteEntity }
  AlreadyRegistered: { readonly athlete: AthleteEntity }
}>
export const RegisterAthleteOutcome = Data.taggedEnum<RegisterAthleteOutcome>()

export class AthletesUseCases extends Effect.Service<AthletesUseCases>()(
  "@one-kilo/core/AthletesUseCases",
  {
    dependencies: [
      AthletesCreationModule.Default,
      AthletesQueryRepository.Default,
      PersonsQueryRepository.Default
    ],
    effect: Effect.gen(function*() {
      const pg = yield* PgClient.PgClient

      const athletesCreationModule = yield* AthletesCreationModule
      const athletesQueryRepository = yield* AthletesQueryRepository
      const personsQueryRepository = yield* PersonsQueryRepository

      const ensureAthlete = Effect.fn("AthletesUseCases.ensureAthlete")(
        function*({ personId, performedByUserId }: EnsureAthleteParameters) {
          const maybePerson = yield* personsQueryRepository.findPersonWithUser({ personId })
          if (Option.isNone(maybePerson)) {
            return yield* Effect.fail(new PersonNotFoundError({ personId }))
          }

          const maybeExistingAthlete = yield* athletesQueryRepository.findAthleteEntityByPersonId({ personId })
          if (Option.isSome(maybeExistingAthlete)) {
            return RegisterAthleteOutcome.AlreadyRegistered({ athlete: maybeExistingAthlete.value })
          }

          const athlete = yield* athletesCreationModule.createAthlete({ personId, performedByUserId })
          return RegisterAthleteOutcome.Registered({ athlete })
        },
        PgClientExtensions.withSerializableTransaction(pg)
      )

      const registerAthlete = Effect.fn("AthletesUseCases.registerAthlete")(
        function*({ personId }: RegisterAthleteParameters) {
          const performedByUserId = yield* Effect.map(Actor, ({ user }) => user.id)

          return yield* ensureAthlete({ personId, performedByUserId })
        },
        (effect, { personId }) =>
          pipe(
            effect,
            Policy.withPolicy(PersonPolicies.canManage(personId))
          )
      )

      return { registerAthlete }
    })
  }
) {}
