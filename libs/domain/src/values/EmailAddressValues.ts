import { pipe } from "effect/Function"
import * as S from "effect/Schema"

// TODO: Make this stricter
export const EmailAddress = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@one-kilo/domain/EmailAddress"),
  S.annotations({
    description: "An email address",
    identifier: "EmailAddress",
    title: "Email Address"
  })
)
export type EmailAddress = typeof EmailAddress.Type
