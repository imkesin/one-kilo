import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { OrganizationDomainId, OrganizationId, UserId } from "./DomainIds.ts"
import { EmailAddress, OrganizationDomainState, OrganizationDomainVerificationStrategy } from "./DomainValues.ts"

export class OrganizationDomain extends S.Class<OrganizationDomain>("@effect-workos/workos/OrganizationDomain")({
  _tag: pipe(
    S.Literal("OrganizationDomain"),
    S.optional,
    S.withDefaults({
      constructor: () => "OrganizationDomain" as const,
      decoding: () => "OrganizationDomain" as const
    })
  ),

  id: OrganizationDomainId,
  organizationId: pipe(
    OrganizationId,
    S.propertySignature,
    S.fromKey("organization_id")
  ),
  domain: S.NonEmptyTrimmedString,
  state: OrganizationDomainState,
  verificationStrategy: pipe(
    OrganizationDomainVerificationStrategy,
    S.propertySignature,
    S.fromKey("verification_strategy")
  ),
  verificationToken: pipe(
    S.NonEmptyTrimmedString,
    S.propertySignature,
    S.fromKey("verification_token")
  )
}) {}

export class Organization extends S.Class<Organization>("@effect-workos/workos/Organization")({
  _tag: pipe(
    S.Literal("Organization"),
    S.optional,
    S.withDefaults({
      constructor: () => "Organization" as const,
      decoding: () => "Organization" as const
    })
  ),

  id: OrganizationId,
  name: S.NonEmptyTrimmedString,

  domains: S.Array(OrganizationDomain),

  stripeCustomerId: pipe(
    S.NonEmptyTrimmedString,
    S.NullOr,
    S.propertySignature,
    S.fromKey("stripe_customer_id")
  ),
  externalId: pipe(
    S.NonEmptyTrimmedString,
    S.NullOr,
    S.propertySignature,
    S.fromKey("external_id")
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
