import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makePrefixedUlidGenerator } from "../lib/ULID.ts"

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

/**
 * The WorkOS Connect Application’s client ID.
 */
export const ClientId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("client_"),
  S.brand("@effect-workos/workos/ClientId")
)
export type ClientId = typeof ClientId.Type
export const generateClientId = makePrefixedUlidGenerator(ClientId, "client")

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

export const OrganizationId = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@effect-workos/workos/OrganizationId")
)
export type OrganizationId = typeof OrganizationId.Type
export const generateOrganizationId = makePrefixedUlidGenerator(OrganizationId, "org")

export const RefreshToken = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@effect-workos/workos/RefreshToken")
)
export type RefreshToken = typeof RefreshToken.Type

export const SessionId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("session_"),
  S.brand("@effect-workos/workos/SessionId")
)
export const generateSessionId = makePrefixedUlidGenerator(SessionId, "session")

export type SessionId = typeof SessionId.Type

export const UserId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("user_"),
  S.brand("@effect-workos/workos/UserId")
)
export type UserId = typeof UserId.Type
export const generateUserId = makePrefixedUlidGenerator(UserId, "user")
