import { MachineUserEntity, PersonUserEntity, type UserEntity } from "@one-kilo/domain/entities/User"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import type { UsersModel } from "../UsersModel.ts"

export const toUserEntity = (model: typeof UsersModel.select.Type): Effect.Effect<UserEntity> => {
  if (
    model.type === "PERSON"
    && model.personId
    && model.workosUserId
  ) {
    return Effect.succeed(
      PersonUserEntity.make({
        id: model.id,
        type: "PERSON",
        personId: model.personId,
        workosUserId: model.workosUserId,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        archivedAt: model.archivedAt
      })
    )
  }

  if (
    model.type === "MACHINE"
    && model.machineId
    && model.workosClientId
  ) {
    return Effect.succeed(
      MachineUserEntity.make({
        id: model.id,
        type: "MACHINE",
        machineId: model.machineId,
        workosClientId: model.workosClientId,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        archivedAt: model.archivedAt
      })
    )
  }

  return dieWithUnexpectedError("A user model could not be converted to a domain entity")
}
