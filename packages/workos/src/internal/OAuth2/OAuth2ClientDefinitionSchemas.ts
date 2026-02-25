import * as Duration from "effect/Duration"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as ParseResult from "effect/ParseResult"
import * as Redacted from "effect/Redacted"
import * as S from "effect/Schema"
import { ApplicationClientId } from "../../domain/Ids.ts"
import { AccessToken, IdToken, RefreshToken } from "../../domain/Values.ts"
import { OAuthUserInfoFields } from "../CommonDefinitions.ts"

type WithRedactedClientSecret<T extends { clientSecret: string }> = {
  [P in keyof T]: P extends "clientSecret" ? Redacted.Redacted<string> : T[P]
}

const ScopeFromSet = S.transform(
  S.Trimmed,
  S.ReadonlySetFromSelf(S.Trimmed),
  {
    strict: true,
    decode: (fromA) => new Set(fromA.split(" ")),
    encode: (toI) => Array.from(toI).join(" ")
  }
)
export const AuthorizeScopeFromSet = S.transformOrFail(
  S.Trimmed,
  S.ReadonlySetFromSelf(
    S.Literal("openid", "profile", "email", "offline_access")
  ),
  {
    strict: true,
    decode: (fromA, _, ast) =>
      ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          fromA,
          "Decoding scopes is not supported"
        )
      ),
    encode: (toI) =>
      ParseResult.succeed(
        Array.from(toI).join(" ")
      )
  }
)

const DurationFromSeconds = S.transform(
  S.Int,
  S.DurationFromSelf,
  {
    strict: true,
    decode: (fromA) => Duration.seconds(fromA),
    encode: (toI) => Duration.toSeconds(toI)
  }
)

const RetrieveTokenParameters_CommonFields = {
  clientId: pipe(
    ApplicationClientId,
    S.propertySignature,
    S.fromKey("client_id")
  ),
  clientSecret: pipe(
    S.NonEmptyTrimmedString,
    S.propertySignature,
    S.fromKey("client_secret")
  )
} as const
const RetrieveTokenResponse_CommonFields = {
  accessToken: pipe(
    AccessToken,
    S.propertySignature,
    S.fromKey("access_token")
  ),
  expiresIn: pipe(
    DurationFromSeconds,
    S.propertySignature,
    S.fromKey("expires_in")
  ),
  tokenType: pipe(
    S.Literal("bearer"),
    S.propertySignature,
    S.fromKey("token_type")
  )
}

export class RetrieveTokenByAuthorizationCodeParameters
  extends S.Class<RetrieveTokenByAuthorizationCodeParameters>("RetrieveTokenByAuthorizationCodeParameters")({
    ...RetrieveTokenParameters_CommonFields,

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
    code: S.NonEmptyTrimmedString,
    redirectUri: pipe(
      S.NonEmptyTrimmedString,
      S.propertySignature,
      S.fromKey("redirect_uri")
    ),

    codeVerifier: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.fromKey("code_verifier")
    )
  })
{}
export type RetrieveTokenByAuthorizationCodeParameters_Redacted = WithRedactedClientSecret<
  RetrieveTokenByAuthorizationCodeParameters
>

export class RetrieveTokenByAuthorizationCodeResponse
  extends S.Class<RetrieveTokenByAuthorizationCodeResponse>("RetrieveTokenByAuthorizationCodeResponse")({
    ...RetrieveTokenResponse_CommonFields,

    idToken: pipe(
      IdToken,
      S.propertySignature,
      S.fromKey("id_token")
    ),
    refreshToken: pipe(
      RefreshToken,
      S.optional,
      S.fromKey("refresh_token")
    )
  })
{}

export class RetrieveTokenByRefreshTokenParameters
  extends S.Class<RetrieveTokenByRefreshTokenParameters>("RetrieveTokenByRefreshTokenParameters")({
    ...RetrieveTokenParameters_CommonFields,

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
    refreshToken: pipe(
      RefreshToken,
      S.propertySignature,
      S.fromKey("refresh_token")
    ),

    scope: pipe(
      ScopeFromSet,
      S.optional
    )
  })
{}
export type RetrieveTokenByRefreshTokenParameters_Redacted = WithRedactedClientSecret<
  RetrieveTokenByRefreshTokenParameters
>

export class RetrieveTokenByRefreshTokenResponse
  extends S.Class<RetrieveTokenByRefreshTokenResponse>("RetrieveTokenByRefreshTokenResponse")({
    ...RetrieveTokenResponse_CommonFields,

    idToken: pipe(
      IdToken,
      S.propertySignature,
      S.fromKey("id_token")
    ),
    refreshToken: pipe(
      RefreshToken,
      S.optional,
      S.fromKey("refresh_token")
    )
  })
{}

export class RetrieveTokenByClientCredentialsParameters
  extends S.Class<RetrieveTokenByClientCredentialsParameters>("RetrieveTokenByClientCredentialsParameters")({
    ...RetrieveTokenParameters_CommonFields,

    grantType: pipe(
      S.requiredToOptional(
        S.Literal("client_credentials"),
        S.Literal("client_credentials"),
        {
          decode: () => Option.some("client_credentials" as const),
          encode: () => "client_credentials" as const
        }
      ),
      S.fromKey("grant_type")
    ),

    scope: pipe(
      ScopeFromSet,
      S.optional
    )
  })
{}
export type RetrieveTokenByClientCredentialsParameters_Redacted = WithRedactedClientSecret<
  RetrieveTokenByClientCredentialsParameters
>

export class RetrieveTokenByClientCredentialsResponse
  extends S.Class<RetrieveTokenByClientCredentialsResponse>("RetrieveTokenByClientCredentialsResponse")({
    ...RetrieveTokenResponse_CommonFields
  })
{}

export class AuthorizeDeviceParameters extends S.Class<AuthorizeDeviceParameters>("AuthorizeDeviceParameters")({
  clientId: pipe(
    ApplicationClientId,
    S.propertySignature,
    S.fromKey("client_id")
  ),
  scope: AuthorizeScopeFromSet
}) {}
export class AuthorizeDeviceResponse extends S.Class<AuthorizeDeviceResponse>("AuthorizeDeviceResponse")({
  deviceCode: pipe(
    S.NonEmptyTrimmedString,
    S.propertySignature,
    S.fromKey("device_code")
  ),
  userCode: pipe(
    S.NonEmptyTrimmedString,
    S.propertySignature,
    S.fromKey("user_code")
  ),
  verificationUri: pipe(
    S.NonEmptyTrimmedString,
    S.propertySignature,
    S.fromKey("verification_uri")
  ),
  verificationUriComplete: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("verification_uri_complete")
  ),
  expiresIn: pipe(
    DurationFromSeconds,
    S.propertySignature,
    S.fromKey("expires_in")
  ),
  interval: pipe(
    DurationFromSeconds,
    S.propertySignature,
    S.fromKey("interval")
  )
}) {}

export class RetrieveTokenByDeviceCodeParameters
  extends S.Class<RetrieveTokenByDeviceCodeParameters>("RetrieveTokenByDeviceCodeParameters")({
    ...RetrieveTokenParameters_CommonFields,

    grantType: pipe(
      S.requiredToOptional(
        S.Literal("urn:ietf:params:oauth:grant-type:device_code"),
        S.Literal("urn:ietf:params:oauth:grant-type:device_code"),
        {
          decode: () => Option.some("urn:ietf:params:oauth:grant-type:device_code" as const),
          encode: () => "urn:ietf:params:oauth:grant-type:device_code" as const
        }
      ),
      S.fromKey("grant_type")
    ),
    deviceCode: pipe(
      S.NonEmptyTrimmedString,
      S.propertySignature,
      S.fromKey("device_code")
    )
  })
{}
export type RetrieveTokenByDeviceCodeParameters_Redacted = WithRedactedClientSecret<
  RetrieveTokenByDeviceCodeParameters
>

export class RetrieveTokenByDeviceCodeResponseSuccess extends S.TaggedClass<RetrieveTokenByDeviceCodeResponseSuccess>()(
  "RetrieveTokenByDeviceCodeResponse.Success",
  {
    ...RetrieveTokenResponse_CommonFields,

    idToken: pipe(
      IdToken,
      S.propertySignature,
      S.fromKey("id_token")
    ),
    refreshToken: pipe(
      RefreshToken,
      S.propertySignature,
      S.fromKey("refresh_token")
    )
  }
) {}
export class RetrieveTokenByDeviceCodeResponseAuthorizationPending
  extends S.TaggedClass<RetrieveTokenByDeviceCodeResponseAuthorizationPending>()(
    "RetrieveTokenByDeviceCodeResponse.AuthorizationPending",
    {
      error: S.Literal("authorization_pending")
    }
  )
{}
export class RetrieveTokenByDeviceCodeResponseAuthorizationDeclined
  extends S.TaggedClass<RetrieveTokenByDeviceCodeResponseAuthorizationDeclined>()(
    "RetrieveTokenByDeviceCodeResponse.AuthorizationDeclined",
    {
      error: S.Literal("authorization_declined")
    }
  )
{}
export class DeviceCodeAuthorizationTerminated
  extends S.TaggedError<DeviceCodeAuthorizationTerminated>("@effect/auth-workos/DeviceCodeAuthorizationTerminated")(
    "DeviceCodeAuthorizationTerminated",
    {
      deviceCode: S.NonEmptyTrimmedString
    }
  )
{}

export class RetrieveUserInfoResponse extends S.Class<RetrieveUserInfoResponse>("RetrieveUserInfoResponse")({
  ...OAuthUserInfoFields
}) {}
