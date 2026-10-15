import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaTransformation from "effect/SchemaTransformation"

export const EmailAddress = pipe(
  S.Trim,
  S.decode(SchemaTransformation.toLowerCase()),
  S.check(S.isNonEmpty()),
  S.check(S.isPattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)),
  S.brand("@one-kilo/domain/EmailAddress"),
  S.annotate({
    description: "An email address",
    identifier: "EmailAddress",
    title: "Email Address"
  })
)
export type EmailAddress = typeof EmailAddress.Type
