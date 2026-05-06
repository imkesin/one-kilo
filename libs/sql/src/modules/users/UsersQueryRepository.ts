import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { PersonUser, User } from "@one-kilo/domain/entities/User"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { dieWithUnexpectedError, orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { EmailAddressesModel } from "../email-addresses/EmailAddressesModel.ts"
import { MachineClientsModel } from "../machine-clients/MachineClientsModel.ts"
import { PersonsModel } from "../persons/PersonsModel.ts"
import { toUser } from "./internal/UsersModelTransformations.ts"
import { UsersModel } from "./UsersModel.ts"

type FindUserEntityByWorkOSUserIdParameters = {
  workosUserId: WorkOSIds.UserId
}

type FindUserByUserIdParameters = {
  userId: UserId
}

export class UsersQueryRepository extends Effect.Service<UsersQueryRepository>()(
  "@one-kilo/sql/UsersQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findUserByWorkOSUserIdSchema = SqlSchema.findOne({
        Request: WorkOSIds.UserId,
        Result: S.extend(
          UsersModel.select,
          S.Struct({
            machineClient: S.Null,
            person: S.extend(
              PersonsModel.select,
              S.Struct({ emailAddresses: S.Array(EmailAddressesModel.select) })
            )
          })
        ),
        execute: (workosUserId) =>
          sql`
            SELECT
              u.*,
              NULL AS machine_client,
              ${sql.unsafe(PersonsModel.asJsonBBuildObjectWithRelations())} AS person,
            FROM users u
            LEFT JOIN persons p
              ON p.id = u.person_id
              AND p.archived_at IS NULL
            LEFT JOIN email_addresses ea
              ON ea.person_id = p.id
              AND ea.archived_at IS NULL
            WHERE
              u.workos_user_id = ${workosUserId}
              AND u.type = 'Person'
              AND u.archived_at IS NULL
            GROUP BY
              u.id,
              p.id
            LIMIT 1
          `
      })
      const findUserByWorkOSUserId = Effect.fn("UsersQueryRepository.findUserByWorkOSUserId")(
        function*({ workosUserId }: FindUserEntityByWorkOSUserIdParameters) {
          const maybeUserModel = yield* findUserByWorkOSUserIdSchema(workosUserId)

          if (Option.isNone(maybeUserModel)) {
            return Option.none<PersonUser>()
          }

          const user = yield* toUser(maybeUserModel.value)

          if (user.type !== "Person") {
            return yield* dieWithUnexpectedError("Expected user to be a person")
          }

          return Option.some(user)
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a user entity")
      )

      const findUserByUserIdSchema = SqlSchema.findOne({
        Request: UserId,
        Result: S.extend(
          UsersModel.select,
          S.Struct({
            person: pipe(
              S.extend(
                PersonsModel.select,
                S.Struct({ emailAddresses: S.Array(EmailAddressesModel.select) })
              ),
              S.NullOr
            ),
            machineClient: pipe(
              MachineClientsModel.select,
              S.NullOr
            )
          })
        ),
        execute: (userId) =>
          sql`
            SELECT
              u.*,
              CASE
                WHEN u.type = 'MachineClient'
                THEN ${sql.unsafe(MachineClientsModel.asJsonBBuildObject())}
              END AS machine_client,
              CASE
                WHEN u.type = 'Person'
                THEN ${sql.unsafe(PersonsModel.asJsonBBuildObjectWithRelations())}
              END AS person
            FROM users u
            LEFT JOIN machine_clients mc
              ON mc.id = u.machine_client_id
              AND mc.archived_at IS NULL
            LEFT JOIN persons p
              ON p.id = u.person_id
              AND p.archived_at IS NULL
            LEFT JOIN email_addresses ea
              ON ea.person_id = p.id
              AND ea.archived_at IS NULL
            WHERE
              u.id = ${userId}
              AND u.archived_at IS NULL
            GROUP BY
              u.id,
              mc.id,
              p.id
            LIMIT 1
          `
      })
      const findUserByUserId = Effect.fn("UsersQueryRepository.findUserByUserId")(
        function*({ userId }: FindUserByUserIdParameters) {
          const maybeUserModel = yield* findUserByUserIdSchema(userId)

          if (Option.isNone(maybeUserModel)) {
            return Option.none<User>()
          }

          return yield* Effect.map(
            toUser(maybeUserModel.value),
            Option.some
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a user")
      )

      return {
        findUserByUserId,
        findUserByWorkOSUserId
      }
    })
  }
) {}
