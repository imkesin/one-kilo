import { MachineClientUserEntity, PersonUserEntity, type UserEntity } from "@one-kilo/domain/entities/User"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type { UsersModel } from "../UsersModel.ts"

export const toUserEntity = ({
  id,
  type,
  personId,
  workosUserId,
  machineClientId,
  workosClientId,
  createdAt,
  updatedAt,
  archivedAt
}: typeof UsersModel.select.Type): Effect.Effect<UserEntity> => {
  if (
    type === "Person"
    && personId
    && workosUserId
  ) {
    return Effect.succeed(
      PersonUserEntity.make({
        id,
        type: "Person",
        personId,
        workosUserId,
        createdAt,
        updatedAt,
        archivedAt
      })
    )
  }

  if (
    type === "MachineClient"
    && machineClientId
    && workosClientId
  ) {
    return Effect.succeed(
      MachineClientUserEntity.make({
        id,
        type: "MachineClient",
        machineClientId,
        workosClientId,
        createdAt,
        updatedAt,
        archivedAt
      })
    )
  }

  return pipe(
    dieWithUnexpectedError("A user model could not be converted to a domain entity"),
    Effect.annotateLogs({
      user: {
        id,
        type
      }
    })
  )
}
