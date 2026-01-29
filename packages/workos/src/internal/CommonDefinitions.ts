import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { EmailAddress } from "../domain/Values.ts"

export const OAuthUserInfoFields = {
  name: pipe(
    S.String,
    S.optional
  ),
  givenName: pipe(
    S.String,
    S.optional,
    S.fromKey("given_name")
  ),
  familyName: pipe(
    S.String,
    S.optional,
    S.fromKey("family_name")
  ),
  email: pipe(
    EmailAddress,
    S.optional
  ),
  emailVerified: pipe(
    S.Boolean,
    S.optional,
    S.fromKey("email_verified")
  )
} as const
