import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import * as SchemaGetter from "effect/SchemaGetter"
import { EmailAddress } from "../domain/Values.ts"

export const OAuthUserInfoFields = {
  name: pipe(
    S.String,
    S.optional
  ),
  givenName: pipe(
    S.String,
    S.optional
  ),
  familyName: pipe(
    S.String,
    S.optional
  ),
  email: pipe(
    EmailAddress,
    S.optional
  ),
  emailVerified: pipe(
    S.Boolean,
    S.optional
  )
} as const

export const OAuthUserInfoKeys = {
  givenName: "given_name",
  familyName: "family_name",
  emailVerified: "email_verified"
} as const

/**
 * A literal that may be omitted on the decoded side but is always present when encoded.
 */
export const LiteralWithEncodingDefault = <const L extends string>(literal: L) =>
  pipe(
    S.Literal(literal),
    S.decodeTo(
      S.optionalKey(S.Literal(literal)),
      {
        decode: SchemaGetter.transformOptional(() => Option.some(literal)),
        encode: SchemaGetter.transformOptional(() => Option.some(literal))
      }
    )
  )
