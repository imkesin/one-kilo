import * as Data from "effect/Data"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { UserFromWire } from "../../domain/Entities.ts"
import { EnvironmentClientId, OrganizationId, UserId } from "../../domain/Ids.ts"
import { AccessToken, AuthenticationCode, Impersonator, RefreshToken } from "../../domain/Values.ts"
import { LiteralWithEncodingDefault } from "../CommonDefinitions.ts"

const AuthenticateRequestCommonFields = {
  clientId: EnvironmentClientId,
  ipAddress: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.optional
  ),
  userAgent: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.optional
  )
} as const

const AuthenticateRequestCommonKeys = {
  clientId: "client_id",
  ipAddress: "ip_address",
  userAgent: "user_agent"
} as const

const AuthenticateRequestWithSecretCommonFields = {
  ...AuthenticateRequestCommonFields,

  clientSecret: S.Trimmed.check(S.isNonEmpty())
} as const

const AuthenticateRequestWithSecretCommonKeys = {
  ...AuthenticateRequestCommonKeys,

  clientSecret: "client_secret"
} as const

const AuthenticateResponseCommonFields = {
  user: UserFromWire,
  organizationId: pipe(
    OrganizationId,
    S.optional
  ),
  accessToken: AccessToken,
  refreshToken: RefreshToken
} as const

const AuthenticateResponseCommonKeys = {
  organizationId: "organization_id",
  accessToken: "access_token",
  refreshToken: "refresh_token"
} as const

export const AuthenticateWithCodeParameters = pipe(
  S.Struct({
    code: AuthenticationCode,
    grantType: LiteralWithEncodingDefault("authorization_code"),

    ...AuthenticateRequestWithSecretCommonFields
  }),
  S.encodeKeys({
    grantType: "grant_type",

    ...AuthenticateRequestWithSecretCommonKeys
  })
)
export type AuthenticateWithCodeParameters = typeof AuthenticateWithCodeParameters.Type

export class AuthenticateWithCodeResponse
  extends S.Class<AuthenticateWithCodeResponse>("AuthenticateWithCodeResponse")({
    ...AuthenticateResponseCommonFields,

    impersonator: pipe(
      Impersonator,
      S.optional
    )
  })
{}
export const AuthenticateWithCodeResponseFromWire = pipe(
  AuthenticateWithCodeResponse,
  S.encodeKeys(AuthenticateResponseCommonKeys)
)

export const AuthenticateWithCodeError = {
  InvalidGrant: S.Struct({
    error: S.Literal("invalid_grant")
  })
} as const

export const AuthenticateWithPKCEParameters = pipe(
  S.Struct({
    code: AuthenticationCode,
    codeVerifier: S.Trimmed.check(S.isNonEmpty()),
    grantType: LiteralWithEncodingDefault("authorization_code"),

    ...AuthenticateRequestCommonFields
  }),
  S.encodeKeys({
    codeVerifier: "code_verifier",
    grantType: "grant_type",

    ...AuthenticateRequestCommonKeys
  })
)
export type AuthenticateWithPKCEParameters = typeof AuthenticateWithPKCEParameters.Type

export const AuthenticateWithRefreshTokenParameters = pipe(
  S.Struct({
    refreshToken: RefreshToken,
    grantType: LiteralWithEncodingDefault("refresh_token"),
    organizationId: pipe(
      OrganizationId,
      S.optional
    ),

    ...AuthenticateRequestWithSecretCommonFields
  }),
  S.encodeKeys({
    refreshToken: "refresh_token",
    grantType: "grant_type",
    organizationId: "organization_id",

    ...AuthenticateRequestWithSecretCommonKeys
  })
)
export type AuthenticateWithRefreshTokenParameters = typeof AuthenticateWithRefreshTokenParameters.Type

export class AuthenticateWithRefreshTokenResponse
  extends S.Class<AuthenticateWithRefreshTokenResponse>("AuthenticateWithRefreshTokenResponse")({
    ...AuthenticateResponseCommonFields
  })
{}
export const AuthenticateWithRefreshTokenResponseFromWire = pipe(
  AuthenticateWithRefreshTokenResponse,
  S.encodeKeys(AuthenticateResponseCommonKeys)
)

export const CreateUserParameters = pipe(
  S.Struct({
    email: S.Trimmed.check(S.isNonEmpty()),

    password: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),

    firstName: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    lastName: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    externalId: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),

    metadata: pipe(
      S.Record(
        S.String,
        S.Unknown
      ),
      S.optional
    )
  }),
  S.encodeKeys({
    firstName: "first_name",
    lastName: "last_name",
    externalId: "external_id"
  })
)
export type CreateUserParameters = typeof CreateUserParameters.Type

export const UpdateUserParameters = pipe(
  S.Struct({
    firstName: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    lastName: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.NullOr,
      S.optional
    ),

    email: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    emailVerified: pipe(
      S.Boolean,
      S.optional
    ),

    externalId: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    locale: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    metadata: pipe(
      S.Record(
        S.String,
        S.Unknown
      ),
      S.optional
    )
  }),
  S.encodeKeys({
    firstName: "first_name",
    lastName: "last_name",
    emailVerified: "email_verified",
    externalId: "external_id"
  })
)
export type UpdateUserParameters = typeof UpdateUserParameters.Type

export type DeleteUserOutcome = Data.TaggedEnum<{
  Success: Record<never, never>
  NotFound: Record<never, never>
}>
export const DeleteUserOutcome = Data.taggedEnum<DeleteUserOutcome>()

export const CreateOrganizationMembershipParameters = pipe(
  S.Struct({
    userId: UserId,
    organizationId: OrganizationId,
    roles: pipe(
      S.NonEmptyArray(S.Trimmed.check(S.isNonEmpty())),
      S.optional
    )
  }),
  S.encodeKeys({
    userId: "user_id",
    organizationId: "organization_id",
    roles: "role_slugs"
  })
)
export type CreateOrganizationMembershipParameters = typeof CreateOrganizationMembershipParameters.Type

export const UpdateOrganizationMembershipParameters = pipe(
  S.Struct({
    roles: S.Array(S.Trimmed.check(S.isNonEmpty()))
  }),
  S.encodeKeys({
    roles: "role_slugs"
  })
)
export type UpdateOrganizationMembershipParameters = typeof UpdateOrganizationMembershipParameters.Type

export type DeleteOrganizationMembershipOutcome = Data.TaggedEnum<{
  Success: Record<never, never>
  NotFound: Record<never, never>
}>
export const DeleteOrganizationMembershipOutcome = Data.taggedEnum<DeleteOrganizationMembershipOutcome>()
