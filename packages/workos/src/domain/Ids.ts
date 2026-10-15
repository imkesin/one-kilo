import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makePrefixedIdGenerator } from "../internal/lib/PrefixedId.ts"

/**
 * The WorkOS Connect Application’s client ID.
 */
export const ApplicationClientId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isStartingWith("client_")),
  S.brand("@effect/auth-workos/ApplicationClientId")
)
export type ApplicationClientId = typeof ApplicationClientId.Type
export const generateClientId = makePrefixedIdGenerator(ApplicationClientId, "client")

export const EnvironmentClientId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isStartingWith("client_")),
  S.brand("@effect/auth-workos/EnvironmentClientId")
)
export type EnvironmentClientId = typeof EnvironmentClientId.Type
export const generateEnvironmentClientId = makePrefixedIdGenerator(EnvironmentClientId, "client")

export const EventId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isStartingWith("event_")),
  S.brand("@effect/auth-workos/EventId")
)
export type EventId = typeof EventId.Type
export const generateEventId = makePrefixedIdGenerator(EventId, "event")

export const OrganizationDomainId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isStartingWith("org_domain_")),
  S.brand("@effect/auth-workos/OrganizationDomainId")
)
export type OrganizationDomainId = typeof OrganizationDomainId.Type
export const generateOrganizationDomainId = makePrefixedIdGenerator(OrganizationDomainId, "org_domain")

export const OrganizationId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.brand("@effect/auth-workos/OrganizationId")
)
export type OrganizationId = typeof OrganizationId.Type
export const generateOrganizationId = makePrefixedIdGenerator(OrganizationId, "org")

export const SessionId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isStartingWith("session_")),
  S.brand("@effect/auth-workos/SessionId")
)
export type SessionId = typeof SessionId.Type
export const generateSessionId = makePrefixedIdGenerator(SessionId, "session")

export const OrganizationMembershipId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isStartingWith("om_")),
  S.brand("@effect/auth-workos/OrganizationMembershipId")
)
export type OrganizationMembershipId = typeof OrganizationMembershipId.Type
export const generateOrganizationMembershipId = makePrefixedIdGenerator(OrganizationMembershipId, "om")

export const UserId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isStartingWith("user_")),
  S.brand("@effect/auth-workos/UserId")
)
export type UserId = typeof UserId.Type
export const generateUserId = makePrefixedIdGenerator(UserId, "user")
