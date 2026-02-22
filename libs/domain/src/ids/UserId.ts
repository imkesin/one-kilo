import * as UUIDGenerator from "@one-kilo/lib/uuid/UUIDGenerator"
import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const UserId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/UserId"),
  S.annotations({
    description: "The unique identifier for a user.",
    identifier: "UserId",
    title: "User ID"
  })
)
export type UserId = typeof UserId.Type

export class UserIdGenerator extends Effect.Service<UserIdGenerator>()(
  "@one-kilo/domain/UserIdGenerator",
  {
    dependencies: [UUIDGenerator.UUIDGenerator.Default],
    effect: Effect.gen(function*() {
      const uuidGenerator = yield* UUIDGenerator.UUIDGenerator
      const generate = Effect.map(uuidGenerator.v7, UserId.make)
      return { generate }
    })
  }
) {}

export const PrefixedUserId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("u_"),
  S.brand("@one-kilo/domain/PrefixedUserId"),
  S.annotations({
    description: "The unique identifier for a user.",
    identifier: "PrefixedUserId",
    title: "User ID (Prefixed)"
  })
)
export type PrefixedUserId = typeof PrefixedUserId.Type

export const UserIdFromPrefixed = makeIdFromPrefixed(
  PrefixedUserId,
  UserId,
  {
    prefix: "u_",
    makeId: UserId.make,
    makePrefixed: PrefixedUserId.make
  }
)
