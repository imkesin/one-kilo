import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { UserCreatedActivityLog } from "@one-kilo/domain/activity-logs/UserActivityLogs"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { ActivityLogsRepository } from "@one-kilo/sql/modules/activity-logs/ActivityLogsRepository"
import { PersonsRepository } from "@one-kilo/sql/modules/persons/PersonsRepository"
import { UsersRepository } from "@one-kilo/sql/modules/users/UsersRepository"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

type CreateHumanUserParameters = {
  id: UserId
  preferredName: PreferredName
  fullName: FullName
  workosUserId: WorkOSIds.UserId
}

export class UsersCreationModule extends Effect.Service<UsersCreationModule>()(
  "@one-kilo/server/UsersCreationModule",
  {
    dependencies: [
      ActivityLogsRepository.Default,
      DomainIdGenerator.Default,
      PersonsRepository.Default,
      UsersRepository.Default
    ],
    effect: Effect.gen(function*() {
      const activityLogsRepository = yield* ActivityLogsRepository
      const idGenerator = yield* DomainIdGenerator
      const personsRepository = yield* PersonsRepository
      const usersRepository = yield* UsersRepository

      const recordUserCreated = Effect.fn("UsersCreationModule.recordUserCreated")(
        function*(user: { id: UserId }) {
          const id = yield* idGenerator.activityLogId

          const activityLog = yield* UserCreatedActivityLog.build({
            id,
            performedByUserId: user.id,
            targets: [{ id: user.id, type: "User" as const }]
          })

          yield* activityLogsRepository.insert({
            ...activityLog,
            encodedContext: Option.none()
          })
        }
      )

      const createPersonUser = Effect.fn("UsersCreationModule.createPersonUser")(
        function*({ id, preferredName, fullName, workosUserId }: CreateHumanUserParameters) {
          const person = yield* pipe(
            personsRepository.insert({
              preferredName,
              fullName,
              performedByUserId: id
            }),
            personsRepository.withDeferredForeignKeyConstraints
          )

          const user = yield* usersRepository.insert({
            id,
            type: "Person",
            personId: person.id,
            workosUserId
          })

          yield* recordUserCreated(user)

          return user
        }
      )

      return { createPersonUser }
    })
  }
) {}
