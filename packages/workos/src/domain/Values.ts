import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const AccessToken = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.brand("@effect/auth-workos/AccessToken")
)
export type AccessToken = typeof AccessToken.Type

export const AuthenticationCode = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.brand("@effect/auth-workos/AuthenticationCode")
)
export type AuthenticationCode = typeof AuthenticationCode.Type

export const AuthenticationMethod = pipe(
  S.Literals([
    "SSO",
    "Password",
    "AppleOAuth",
    "GithubOAuth",
    "GoogleOAuth",
    "MicrosoftOAuth",
    "MagicAuth",
    "Impersonation"
  ]),
  S.brand("@effect/auth-workos/AuthenticationMethod")
)
export type AuthenticationMethod = typeof AuthenticationMethod.Type

export const EmailAddress = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.brand("@effect/auth-workos/EmailAddress")
)
export type EmailAddress = typeof EmailAddress.Type

export const EventType = S.Literals(["user.updated"])
export type EventType = typeof EventType.Type

export const IdToken = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.brand("@effect/auth-workos/IdToken")
)
export type IdToken = typeof IdToken.Type

export class Impersonator extends S.Class<Impersonator>("@effect/auth-workos/Impersonator")({
  _tag: pipe(
    S.tag("Impersonator"),
    S.withDecodingDefaultKey(Effect.succeed("Impersonator" as const))
  ),

  email: EmailAddress,
  reason: pipe(
    S.String,
    S.optional
  )
}) {}

export const OrganizationDomainState = pipe(
  S.Literals(["verified", "pending", "failed"]),
  S.brand("@effect/auth-workos/OrganizationDomainState")
)
export type OrganizationDomainState = typeof OrganizationDomainState.Type

export const OrganizationDomainVerificationStrategy = pipe(
  S.Literals(["dns", "manual"]),
  S.brand("@effect/auth-workos/OrganizationDomainVerificationStrategy")
)
export type OrganizationDomainVerificationStrategy = typeof OrganizationDomainVerificationStrategy.Type

export const OrganizationMembershipStatus = pipe(
  S.Literals(["active", "inactive", "pending"]),
  S.brand("@effect/auth-workos/OrganizationMembershipStatus")
)
export type OrganizationMembershipStatus = typeof OrganizationMembershipStatus.Type

export const RefreshToken = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.brand("@effect/auth-workos/RefreshToken")
)
export type RefreshToken = typeof RefreshToken.Type

export class Role extends S.Class<Role>("@effect/auth-workos/Role")({
  slug: S.Trimmed.check(S.isNonEmpty())
}) {}
