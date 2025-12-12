import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { EmailAddress, UserId } from "./DomainIds.ts"

export class User extends S.Class<User>("@effect-workos/workos/User")({
  _tag: pipe(
    S.Literal("User"),
    S.optional,
    S.withDefaults({
      constructor: () => "User" as const,
      decoding: () => "User" as const
    })
  ),

  id: UserId,
  email: EmailAddress,
  emailVerified: pipe(
    S.Boolean,
    S.propertySignature,
    S.fromKey("email_verified")
  ),

  firstName: pipe(
    S.NonEmptyTrimmedString,
    S.NullOr,
    S.propertySignature,
    S.fromKey("first_name")
  ),
  lastName: pipe(
    S.NonEmptyTrimmedString,
    S.NullOr,
    S.propertySignature,
    S.fromKey("last_name")
  ),
  profilePictureUrl: pipe(
    S.NonEmptyTrimmedString,
    S.NullOr,
    S.propertySignature,
    S.fromKey("profile_picture_url")
  ),
  externalId: pipe(
    S.NonEmptyTrimmedString,
    S.NullOr,
    S.propertySignature,
    S.fromKey("external_id")
  ),
  lastSignInAt: pipe(
    S.Date,
    S.NullOr,
    S.propertySignature,
    S.fromKey("last_sign_in_at")
  ),
  locale: pipe(
    S.NonEmptyTrimmedString,
    S.NullOr
  ),

  metadata: S.Record({
    key: S.String,
    value: S.Unknown
  }),

  createdAt: pipe(
    S.Date,
    S.propertySignature,
    S.fromKey("created_at")
  ),
  updatedAt: pipe(
    S.Date,
    S.propertySignature,
    S.fromKey("updated_at")
  )
}) {}

export const AuthenticationMethod = pipe(
  S.Literal(
    "SSO",
    "Password",
    "AppleOAuth",
    "GithubOAuth",
    "GoogleOAuth",
    "MicrosoftOAuth",
    "MagicAuth",
    "Impersonation"
  ),
  S.brand("@effect-workos/workos/AuthenticationMethod")
)
export type AuthenticationMethod = typeof AuthenticationMethod.Type
