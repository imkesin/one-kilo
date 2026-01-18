import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const AccessToken = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@effect-workos/workos/AccessToken")
)
export type AccessToken = typeof AccessToken.Type

export const AuthenticationCode = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@effect-workos/workos/AuthenticationCode")
)
export type AuthenticationCode = typeof AuthenticationCode.Type

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

export const EmailAddress = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@effect-workos/workos/EmailAddress")
)
export type EmailAddress = typeof EmailAddress.Type

export const IdToken = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@effect-workos/workos/IdToken")
)
export type IdToken = typeof IdToken.Type

export class Impersonator extends S.Class<Impersonator>("@effect-workos/workos/Impersonator")({
  _tag: pipe(
    S.Literal("Impersonator"),
    S.optional,
    S.withDefaults({
      constructor: () => "Impersonator" as const,
      decoding: () => "Impersonator" as const
    })
  ),

  email: EmailAddress,
  reason: pipe(
    S.String,
    S.optional
  )
}) {}

export const OrganizationDomainState = pipe(
  S.Literal("verified", "pending", "failed"),
  S.brand("@effect-workos/workos/OrganizationDomainState")
)
export type OrganizationDomainState = typeof OrganizationDomainState.Type

export const OrganizationDomainVerificationStrategy = pipe(
  S.Literal("dns", "manual"),
  S.brand("@effect-workos/workos/OrganizationDomainVerificationStrategy")
)
export type OrganizationDomainVerificationStrategy = typeof OrganizationDomainVerificationStrategy.Type

export const RefreshToken = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@effect-workos/workos/RefreshToken")
)
export type RefreshToken = typeof RefreshToken.Type
