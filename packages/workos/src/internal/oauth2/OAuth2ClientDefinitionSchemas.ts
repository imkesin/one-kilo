import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type * as Redacted from "effect/Redacted"
import * as S from "effect/Schema"
import * as SchemaGetter from "effect/SchemaGetter"
import * as SchemaTransformation from "effect/SchemaTransformation"
import { ApplicationClientId } from "../../domain/Ids.ts"
import { AccessToken, IdToken, RefreshToken } from "../../domain/Values.ts"
import { LiteralWithEncodingDefault, OAuthUserInfoFields, OAuthUserInfoKeys } from "../CommonDefinitions.ts"

type WithRedactedClientSecret<T extends { clientSecret: string }> = {
  [P in keyof T]: P extends "clientSecret" ? Redacted.Redacted : T[P]
}

const ScopeFromSet = pipe(
  S.Trimmed,
  S.decodeTo(
    S.ReadonlySet(S.Trimmed),
    SchemaTransformation.transform({
      decode: (scopes): ReadonlySet<string> => new Set(scopes.split(" ")),
      encode: (scopes) => Array.from(scopes).join(" ")
    })
  )
)
export const AuthorizeScopeFromSet = pipe(
  S.Trimmed,
  S.decodeTo(
    S.ReadonlySet(
      S.Literals(["openid", "profile", "email", "offline_access"])
    ),
    {
      decode: SchemaGetter.forbidden(() => "Decoding scopes is not supported"),
      encode: SchemaGetter.transform((scopes) => Array.from(scopes).join(" "))
    }
  )
)

const DurationFromSeconds = pipe(
  S.Int,
  S.decodeTo(
    S.Duration,
    SchemaTransformation.transform({
      decode: (seconds) => Duration.seconds(seconds),
      encode: (duration) => Duration.toSeconds(duration)
    })
  )
)

const RetrieveTokenParameters_CommonFields = {
  clientId: ApplicationClientId,
  clientSecret: S.Trimmed.check(S.isNonEmpty())
} as const
const RetrieveTokenParameters_CommonKeys = {
  clientId: "client_id",
  clientSecret: "client_secret",
  grantType: "grant_type"
} as const

const RetrieveTokenResponse_CommonFields = {
  accessToken: AccessToken,
  expiresIn: DurationFromSeconds,
  tokenType: S.Literal("bearer")
} as const
const RetrieveTokenResponse_CommonKeys = {
  accessToken: "access_token",
  expiresIn: "expires_in",
  tokenType: "token_type"
} as const

const RetrieveTokenResponse_IdentityKeys = {
  ...RetrieveTokenResponse_CommonKeys,

  idToken: "id_token",
  refreshToken: "refresh_token"
} as const

export const RetrieveTokenByAuthorizationCodeParameters = pipe(
  S.Struct({
    ...RetrieveTokenParameters_CommonFields,

    grantType: LiteralWithEncodingDefault("authorization_code"),
    code: S.Trimmed.check(S.isNonEmpty()),
    redirectUri: S.Trimmed.check(S.isNonEmpty()),

    codeVerifier: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    )
  }),
  S.encodeKeys({
    ...RetrieveTokenParameters_CommonKeys,

    redirectUri: "redirect_uri",
    codeVerifier: "code_verifier"
  })
)
export type RetrieveTokenByAuthorizationCodeParameters = typeof RetrieveTokenByAuthorizationCodeParameters.Type
export type RetrieveTokenByAuthorizationCodeParameters_Redacted = WithRedactedClientSecret<
  RetrieveTokenByAuthorizationCodeParameters
>

export class RetrieveTokenByAuthorizationCodeResponse
  extends S.Class<RetrieveTokenByAuthorizationCodeResponse>("RetrieveTokenByAuthorizationCodeResponse")({
    ...RetrieveTokenResponse_CommonFields,

    idToken: IdToken,
    refreshToken: pipe(
      RefreshToken,
      S.optional
    )
  })
{}
export const RetrieveTokenByAuthorizationCodeResponseFromWire = pipe(
  RetrieveTokenByAuthorizationCodeResponse,
  S.encodeKeys(RetrieveTokenResponse_IdentityKeys)
)

export const RetrieveTokenByRefreshTokenParameters = pipe(
  S.Struct({
    ...RetrieveTokenParameters_CommonFields,

    grantType: LiteralWithEncodingDefault("refresh_token"),
    refreshToken: RefreshToken,

    scope: pipe(
      ScopeFromSet,
      S.optional
    )
  }),
  S.encodeKeys({
    ...RetrieveTokenParameters_CommonKeys,

    refreshToken: "refresh_token"
  })
)
export type RetrieveTokenByRefreshTokenParameters = typeof RetrieveTokenByRefreshTokenParameters.Type
export type RetrieveTokenByRefreshTokenParameters_Redacted = WithRedactedClientSecret<
  RetrieveTokenByRefreshTokenParameters
>

export class RetrieveTokenByRefreshTokenResponse
  extends S.Class<RetrieveTokenByRefreshTokenResponse>("RetrieveTokenByRefreshTokenResponse")({
    ...RetrieveTokenResponse_CommonFields,

    idToken: IdToken,
    refreshToken: pipe(
      RefreshToken,
      S.optional
    )
  })
{}
export const RetrieveTokenByRefreshTokenResponseFromWire = pipe(
  RetrieveTokenByRefreshTokenResponse,
  S.encodeKeys(RetrieveTokenResponse_IdentityKeys)
)

export const RetrieveTokenByClientCredentialsParameters = pipe(
  S.Struct({
    ...RetrieveTokenParameters_CommonFields,

    grantType: LiteralWithEncodingDefault("client_credentials")
  }),
  S.encodeKeys(RetrieveTokenParameters_CommonKeys)
)
export type RetrieveTokenByClientCredentialsParameters = typeof RetrieveTokenByClientCredentialsParameters.Type
export type RetrieveTokenByClientCredentialsParameters_Redacted = WithRedactedClientSecret<
  RetrieveTokenByClientCredentialsParameters
>

export class RetrieveTokenByClientCredentialsResponse
  extends S.Class<RetrieveTokenByClientCredentialsResponse>("RetrieveTokenByClientCredentialsResponse")({
    ...RetrieveTokenResponse_CommonFields
  })
{}
export const RetrieveTokenByClientCredentialsResponseFromWire = pipe(
  RetrieveTokenByClientCredentialsResponse,
  S.encodeKeys(RetrieveTokenResponse_CommonKeys)
)

export const AuthorizeDeviceParameters = pipe(
  S.Struct({
    clientId: ApplicationClientId,
    scope: AuthorizeScopeFromSet
  }),
  S.encodeKeys({
    clientId: "client_id"
  })
)
export type AuthorizeDeviceParameters = typeof AuthorizeDeviceParameters.Type

export class AuthorizeDeviceResponse extends S.Class<AuthorizeDeviceResponse>("AuthorizeDeviceResponse")({
  deviceCode: S.Trimmed.check(S.isNonEmpty()),
  userCode: S.Trimmed.check(S.isNonEmpty()),
  verificationUri: S.Trimmed.check(S.isNonEmpty()),
  verificationUriComplete: pipe(
    S.Trimmed.check(S.isNonEmpty()),
    S.optional
  ),
  expiresIn: DurationFromSeconds,
  interval: DurationFromSeconds
}) {}
export const AuthorizeDeviceResponseFromWire = pipe(
  AuthorizeDeviceResponse,
  S.encodeKeys({
    deviceCode: "device_code",
    userCode: "user_code",
    verificationUri: "verification_uri",
    verificationUriComplete: "verification_uri_complete",
    expiresIn: "expires_in"
  })
)

export const RetrieveTokenByDeviceCodeParameters = pipe(
  S.Struct({
    ...RetrieveTokenParameters_CommonFields,

    grantType: LiteralWithEncodingDefault("urn:ietf:params:oauth:grant-type:device_code"),
    deviceCode: S.Trimmed.check(S.isNonEmpty())
  }),
  S.encodeKeys({
    ...RetrieveTokenParameters_CommonKeys,

    deviceCode: "device_code"
  })
)
export type RetrieveTokenByDeviceCodeParameters = typeof RetrieveTokenByDeviceCodeParameters.Type
export type RetrieveTokenByDeviceCodeParameters_Redacted = WithRedactedClientSecret<
  RetrieveTokenByDeviceCodeParameters
>

/*
 * WorkOS responses carry no `_tag`, so it is defaulted while decoding.
 */
export class RetrieveTokenByDeviceCodeResponseSuccess
  extends S.Class<RetrieveTokenByDeviceCodeResponseSuccess>("RetrieveTokenByDeviceCodeResponse.Success")({
    _tag: pipe(
      S.tag("RetrieveTokenByDeviceCodeResponse.Success"),
      S.withDecodingDefaultKey(Effect.succeed("RetrieveTokenByDeviceCodeResponse.Success" as const))
    ),

    ...RetrieveTokenResponse_CommonFields,

    idToken: IdToken,
    refreshToken: RefreshToken
  })
{}
export const RetrieveTokenByDeviceCodeResponseSuccessFromWire = pipe(
  RetrieveTokenByDeviceCodeResponseSuccess,
  S.encodeKeys(RetrieveTokenResponse_IdentityKeys)
)

export class RetrieveTokenByDeviceCodeResponseAuthorizationPending
  extends S.Class<RetrieveTokenByDeviceCodeResponseAuthorizationPending>(
    "RetrieveTokenByDeviceCodeResponse.AuthorizationPending"
  )({
    _tag: pipe(
      S.tag("RetrieveTokenByDeviceCodeResponse.AuthorizationPending"),
      S.withDecodingDefaultKey(Effect.succeed("RetrieveTokenByDeviceCodeResponse.AuthorizationPending" as const))
    ),

    error: S.Literal("authorization_pending")
  })
{}
export class RetrieveTokenByDeviceCodeResponseAuthorizationDeclined
  extends S.Class<RetrieveTokenByDeviceCodeResponseAuthorizationDeclined>(
    "RetrieveTokenByDeviceCodeResponse.AuthorizationDeclined"
  )({
    _tag: pipe(
      S.tag("RetrieveTokenByDeviceCodeResponse.AuthorizationDeclined"),
      S.withDecodingDefaultKey(Effect.succeed("RetrieveTokenByDeviceCodeResponse.AuthorizationDeclined" as const))
    ),

    error: S.Literal("authorization_declined")
  })
{}

export class DeviceCodeAuthorizationTerminatedError extends S.TaggedError<DeviceCodeAuthorizationTerminatedError>(
  "@effect/auth-workos/DeviceCodeAuthorizationTerminatedError"
)(
  "DeviceCodeAuthorizationTerminatedError",
  {
    deviceCode: S.Trimmed.check(S.isNonEmpty())
  }
) {}

export class RetrieveUserInfoResponse extends S.Class<RetrieveUserInfoResponse>("RetrieveUserInfoResponse")({
  ...OAuthUserInfoFields
}) {}
export const RetrieveUserInfoResponseFromWire = pipe(
  RetrieveUserInfoResponse,
  S.encodeKeys(OAuthUserInfoKeys)
)
