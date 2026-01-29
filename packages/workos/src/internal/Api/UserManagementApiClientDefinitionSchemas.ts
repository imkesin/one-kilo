import * as Data from "effect/Data"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { User } from "../../domain/Entities.ts"
import { ClientId, OrganizationId, UserId } from "../../domain/Ids.ts"
import { AccessToken, AuthenticationCode, Impersonator, RefreshToken } from "../../domain/Values.ts"

const AuthenticateRequestCommonFields = {
  clientId: pipe(
    ClientId,
    S.propertySignature,
    S.fromKey("client_id")
  ),
  ipAddress: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("ip_address")
  ),
  userAgent: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("user_agent")
  )
} as const

const AuthenticateRequestWithSecretCommonFields = {
  ...AuthenticateRequestCommonFields,

  clientSecret: pipe(
    S.NonEmptyTrimmedString,
    S.propertySignature,
    S.fromKey("client_secret")
  )
} as const

const AuthenticateResponseCommonFields = {
  user: User,
  organizationId: pipe(
    OrganizationId,
    S.optional,
    S.fromKey("organization_id")
  ),
  accessToken: pipe(
    AccessToken,
    S.propertySignature,
    S.fromKey("access_token")
  ),
  refreshToken: pipe(
    RefreshToken,
    S.propertySignature,
    S.fromKey("refresh_token")
  )
} as const

export class AuthenticateWithCodeParameters
  extends S.Class<AuthenticateWithCodeParameters>("AuthenticateWithCodeParameters")({
    code: AuthenticationCode,
    grantType: pipe(
      S.requiredToOptional(
        S.Literal("authorization_code"),
        S.Literal("authorization_code"),
        {
          decode: () => Option.some("authorization_code" as const),
          encode: () => "authorization_code" as const
        }
      )
    ),

    ...AuthenticateRequestWithSecretCommonFields
  })
{}
export class AuthenticateWithCodeResponse
  extends S.Class<AuthenticateWithCodeResponse>("AuthenticateWithCodeResponse")({
    ...AuthenticateResponseCommonFields,

    impersonator: pipe(
      Impersonator,
      S.optional
    )
  })
{}

export class AuthenticateWithPKCEParameters
  extends S.Class<AuthenticateWithPKCEParameters>("AuthenticateWithPKCEParameters")({
    code: AuthenticationCode,
    codeVerifier: pipe(
      S.NonEmptyTrimmedString,
      S.propertySignature,
      S.fromKey("code_verifier")
    ),
    grantType: pipe(
      S.requiredToOptional(
        S.Literal("authorization_code"),
        S.Literal("authorization_code"),
        {
          decode: () => Option.some("authorization_code" as const),
          encode: () => "authorization_code" as const
        }
      ),
      S.fromKey("grant_type")
    ),

    ...AuthenticateRequestCommonFields
  })
{}

export class AuthenticateWithRefreshTokenParameters
  extends S.Class<AuthenticateWithRefreshTokenParameters>("AuthenticateWithRefreshTokenParameters")({
    refreshToken: pipe(
      RefreshToken,
      S.propertySignature,
      S.fromKey("refresh_token")
    ),
    grantType: pipe(
      S.requiredToOptional(
        S.Literal("refresh_token"),
        S.Literal("refresh_token"),
        {
          decode: () => Option.some("refresh_token" as const),
          encode: () => "refresh_token" as const
        }
      ),
      S.fromKey("grant_type")
    ),

    ...AuthenticateRequestWithSecretCommonFields
  })
{}
export class AuthenticateWithRefreshTokenResponse
  extends S.Class<AuthenticateWithRefreshTokenResponse>("AuthenticateWithRefreshTokenResponse")({
    ...AuthenticateResponseCommonFields
  })
{}

export class CreateUserParameters extends S.Class<CreateUserParameters>("CreateUserParameters")({
  email: S.NonEmptyTrimmedString,

  password: pipe(
    S.NonEmptyTrimmedString,
    S.optional
  ),

  firstName: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("first_name")
  ),
  lastName: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("last_name")
  ),
  externalId: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("external_id")
  ),

  metadata: pipe(
    S.Record({
      key: S.String,
      value: S.Unknown
    }),
    S.optional
  )
}) {}

export type DeleteUserResponse = Data.TaggedEnum<{
  Success: Record<never, never>
  NotFound: Record<never, never>
}>
export const DeleteUserResponse = Data.taggedEnum<DeleteUserResponse>()

export class CreateOrganizationMembershipParameters
  extends S.Class<CreateOrganizationMembershipParameters>("CreateOrganizationMembershipParameters")({
    userId: pipe(
      UserId,
      S.propertySignature,
      S.fromKey("user_id")
    ),
    organizationId: pipe(
      OrganizationId,
      S.propertySignature,
      S.fromKey("organization_id")
    ),
    roles: pipe(
      S.Array(S.NonEmptyTrimmedString),
      S.propertySignature,
      S.fromKey("role_slugs")
    )
  })
{}
export class UpdateOrganizationMembershipParameters
  extends S.Class<UpdateOrganizationMembershipParameters>("UpdateOrganizationMembershipParameters")({
    roles: pipe(
      S.Array(S.NonEmptyTrimmedString),
      S.propertySignature,
      S.fromKey("role_slugs")
    )
  })
{}

export type DeleteOrganizationMembershipResponse = Data.TaggedEnum<{
  Success: Record<never, never>
  NotFound: Record<never, never>
}>
export const DeleteOrganizationMembershipResponse = Data.taggedEnum<DeleteOrganizationMembershipResponse>()
