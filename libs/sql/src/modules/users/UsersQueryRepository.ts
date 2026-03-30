import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { User, UserEntity } from "@one-kilo/domain/entities/User"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { EmailAddressesModel } from "../email-addresses/EmailAddressesModel.ts"
import { MachineClientsModel } from "../machine-clients/MachineClientsModel.ts"
import { PersonsModel } from "../persons/PersonsModel.ts"
import { toUser } from "./internal/UsersModelTransformations.ts"
import { toUserEntity } from "./internal/UsersModelTransformations.ts"
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

      const findUserEntityByWorkOSUserIdSchema = SqlSchema.findOne({
        Request: WorkOSIds.UserId,
        Result: UsersModel.select,
        execute: (workosUserId) =>
          sql`
            SELECT *
            FROM users u
            WHERE
              u.workos_user_id = ${workosUserId}
              AND u.archived_at IS NULL
            LIMIT 1
          `
      })
      const findUserEntityByWorkOSUserId = Effect.fn("UsersQueryRepository.findUserEntityByWorkOSUserId")(
        function*({ workosUserId }: FindUserEntityByWorkOSUserIdParameters) {
          const maybeUserModel = yield* findUserEntityByWorkOSUserIdSchema(workosUserId)

          if (Option.isNone(maybeUserModel)) {
            return Option.none<UserEntity>()
          }

          return yield* Effect.map(
            toUserEntity(maybeUserModel.value),
            Option.some
          )
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
                WHEN u.type = 'Person'
                THEN ${sql.unsafe(PersonsModel.asJsonBBuildObjectWithRelations())}
              END AS person,
              CASE
                WHEN u.type = 'MachineClient'
                THEN ${sql.unsafe(MachineClientsModel.asJsonBBuildObject())}
              END AS machine_client
            FROM users u
            LEFT JOIN persons p
              ON p.id = u.person_id
              AND p.archived_at IS NULL
            LEFT JOIN email_addresses ea
              ON ea.person_id = p.id
              AND ea.archived_at IS NULL
            LEFT JOIN machine_clients mc
              ON mc.id = u.machine_client_id
              AND mc.archived_at IS NULL
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
          const maybeResult = yield* findUserByUserIdSchema(userId)

          if (Option.isNone(maybeResult)) {
            return Option.none<User>()
          }

          return yield* Effect.map(
            toUser(maybeResult.value),
            Option.some
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a user")
      )

      return { findUserEntityByWorkOSUserId, findUserByUserId }
    })
  }
) {}
