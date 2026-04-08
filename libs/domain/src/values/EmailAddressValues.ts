import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const EmailAddress = pipe(
  S.Trim,
  S.compose(S.Lowercase),
  S.nonEmptyString(),
  S.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/),
  S.brand("@one-kilo/domain/EmailAddress"),
  S.annotations({
    description: "An email address",
    identifier: "EmailAddress",
    title: "Email Address"
  })
)
export type EmailAddress = typeof EmailAddress.Type
