import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { EventId, OrganizationDomainId, OrganizationId, OrganizationMembershipId, UserId } from "./Ids.ts"
import {
  EmailAddress,
  EventType,
  OrganizationDomainState,
  OrganizationDomainVerificationStrategy,
  OrganizationMembershipStatus,
  Role
} from "./Values.ts"

export class OrganizationDomain extends S.Class<OrganizationDomain>("@effect/auth-workos/OrganizationDomain")({
  _tag: pipe(
    S.tag("OrganizationDomain"),
    S.withDecodingDefaultKey(Effect.succeed("OrganizationDomain" as const))
  ),

  id: OrganizationDomainId,
  organizationId: OrganizationId,
  domain: S.Trimmed.check(S.isNonEmpty()),
  state: OrganizationDomainState,
  verificationStrategy: OrganizationDomainVerificationStrategy,
  verificationToken: S.Trimmed.check(S.isNonEmpty())
}) {}

export const OrganizationDomainFromWire = pipe(
  OrganizationDomain,
  S.encodeKeys({
    organizationId: "organization_id",
    verificationStrategy: "verification_strategy",
    verificationToken: "verification_token"
  })
)

export class Organization extends S.Class<Organization>("@effect/auth-workos/Organization")({
  _tag: pipe(
    S.tag("Organization"),
    S.withDecodingDefaultKey(Effect.succeed("Organization" as const))
  ),

  id: OrganizationId,
  name: S.Trimmed.check(S.isNonEmpty()),

  domains: S.Array(OrganizationDomainFromWire),

  stripeCustomerId: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.NullOr,
    S.withDecodingDefault(Effect.succeed(null))
  ),
  externalId: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.NullOr
  ),

  metadata: S.Record(
    S.String,
    S.Unknown
  ),

  createdAt: S.DateFromString,
  updatedAt: S.DateFromString
}) {}

export const OrganizationFromWire = pipe(
  Organization,
  S.encodeKeys({
    stripeCustomerId: "stripe_customer_id",
    externalId: "external_id",
    createdAt: "created_at",
    updatedAt: "updated_at"
  })
)

const OrganizationMembershipBaseFields = {
  _tag: pipe(
    S.tag("OrganizationMembership"),
    S.withDecodingDefaultKey(Effect.succeed("OrganizationMembership" as const))
  ),

  id: OrganizationMembershipId,
  userId: UserId,
  organizationId: OrganizationId,
  roles: S.Array(Role),
  status: OrganizationMembershipStatus,

  createdAt: S.DateFromString,
  updatedAt: S.DateFromString
} as const

export class OrganizationMembership extends S.Class<OrganizationMembership>(
  "@effect/auth-workos/OrganizationMembership"
)({
  ...OrganizationMembershipBaseFields,

  organizationName: S.Trimmed.check(S.isNonEmpty())
}) {
  static normalizedFields = OrganizationMembershipBaseFields
}

export const OrganizationMembershipFromWire = pipe(
  OrganizationMembership,
  S.encodeKeys({
    userId: "user_id",
    organizationId: "organization_id",
    organizationName: "organization_name",
    createdAt: "created_at",
    updatedAt: "updated_at"
  })
)

export class User extends S.Class<User>("@effect/auth-workos/User")({
  _tag: pipe(
    S.tag("User"),
    S.withDecodingDefaultKey(Effect.succeed("User" as const))
  ),

  id: UserId,
  email: EmailAddress,
  emailVerified: S.Boolean,

  firstName: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.NullOr
  ),
  lastName: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.NullOr
  ),
  profilePictureUrl: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.NullOr
  ),
  externalId: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.NullOr
  ),
  lastSignInAt: pipe(
    S.DateFromString,
    S.NullOr
  ),
  locale: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.NullOr
  ),

  metadata: pipe(
    S.Record(
      S.String,
      S.Unknown
    ),
    S.optional
  ),

  createdAt: S.DateFromString,
  updatedAt: S.DateFromString
}) {}

export const UserFromWire = pipe(
  User,
  S.encodeKeys({
    emailVerified: "email_verified",
    firstName: "first_name",
    lastName: "last_name",
    profilePictureUrl: "profile_picture_url",
    externalId: "external_id",
    lastSignInAt: "last_sign_in_at",
    createdAt: "created_at",
    updatedAt: "updated_at"
  })
)

export class UserUpdatedEvent extends S.Class<UserUpdatedEvent>("@effect/auth-workos/UserUpdatedEvent")({
  _tag: pipe(
    S.tag("UserUpdatedEvent"),
    S.withDecodingDefaultKey(Effect.succeed("UserUpdatedEvent" as const))
  ),

  id: EventId,
  event: EventType.pick(["user.updated"]),
  data: UserFromWire,

  createdAt: S.DateFromString
}) {}

export const UserUpdatedEventFromWire = pipe(
  UserUpdatedEvent,
  S.encodeKeys({
    createdAt: "created_at"
  })
)

export const Event = S.Union([UserUpdatedEvent])
export type Event = typeof Event.Type

export const EventFromWire = S.Union([UserUpdatedEventFromWire])
