import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makePrefixedIdGenerator } from "../lib/PrefixedId.ts"

/**
 * The WorkOS Connect Application’s client ID.
 */
export const ClientId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("client_"),
  S.brand("@effect-workos/workos/ClientId")
)
export type ClientId = typeof ClientId.Type
export const generateClientId = makePrefixedIdGenerator(ClientId, "client")

export const OrganizationDomainId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("org_domain_"),
  S.brand("@effect-workos/workos/OrganizationDomainId")
)
export type OrganizationDomainId = typeof OrganizationDomainId.Type
export const generateOrganizationDomainId = makePrefixedIdGenerator(OrganizationDomainId, "org_domain")

export const OrganizationId = pipe(
  S.NonEmptyTrimmedString,
  S.brand("@effect-workos/workos/OrganizationId")
)
export type OrganizationId = typeof OrganizationId.Type
export const generateOrganizationId = makePrefixedIdGenerator(OrganizationId, "org")

export const SessionId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("session_"),
  S.brand("@effect-workos/workos/SessionId")
)
export type SessionId = typeof SessionId.Type
export const generateSessionId = makePrefixedIdGenerator(SessionId, "session")

export const OrganizationMembershipId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("om_"),
  S.brand("@effect-workos/workos/OrganizationMembershipId")
)
export type OrganizationMembershipId = typeof OrganizationMembershipId.Type
export const generateOrganizationMembershipId = makePrefixedIdGenerator(OrganizationMembershipId, "om")

export const UserId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("user_"),
  S.brand("@effect-workos/workos/UserId")
)
export type UserId = typeof UserId.Type
export const generateUserId = makePrefixedIdGenerator(UserId, "user")
