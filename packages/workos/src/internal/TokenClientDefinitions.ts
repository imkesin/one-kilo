import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type * as HttpClientError from "effect/http/HttpClientError"
import * as S from "effect/Schema"
import * as SchemaTransformation from "effect/SchemaTransformation"
import * as Jose from "jose"
import { ApplicationClientId, OrganizationId, UserId } from "../domain/Ids.ts"
import { type AccessToken, EmailAddress, type IdToken } from "../domain/Values.ts"
import { OAuthUserInfoFields, OAuthUserInfoKeys } from "./CommonDefinitions.ts"

const DateFromSeconds = pipe(
  S.Int,
  S.decodeTo(
    S.Date,
    SchemaTransformation.transform({
      decode: (seconds) => new Date(seconds * 1000),
      encode: (date) => Math.floor(date.getTime() / 1000)
    })
  )
)

const DecodedAccessTokenCommonFields = {
  iss: S.Trimmed.check(S.isNonEmpty()),
  exp: DateFromSeconds,
  iat: DateFromSeconds,
  orgId: S.OptionFromOptional(OrganizationId),
  jti: S.Trimmed.check(S.isNonEmpty())
} as const

const DecodedAccessTokenCommonKeys = {
  orgId: "org_id"
} as const

class DecodedMachineAccessToken extends S.Class<DecodedMachineAccessToken>("DecodedMachineAccessToken")({
  _tag: pipe(
    S.tag("DecodedMachineAccessToken"),
    S.withDecodingDefaultKey(Effect.succeed("DecodedMachineAccessToken" as const))
  ),

  ...DecodedAccessTokenCommonFields,

  sub: ApplicationClientId
}) {}

const DecodedOAuthTokenCommonFields = {
  ...DecodedAccessTokenCommonFields,

  sub: UserId,
  aud: S.Trimmed.check(S.isNonEmpty())
} as const

class DecodedOAuthAccessToken extends S.Class<DecodedOAuthAccessToken>("DecodedOAuthAccessToken")({
  _tag: pipe(
    S.tag("DecodedOAuthAccessToken"),
    S.withDecodingDefaultKey(Effect.succeed("DecodedOAuthAccessToken" as const))
  ),

  ...DecodedOAuthTokenCommonFields,

  sid: S.Trimmed.check(S.isNonEmpty())
}) {}

class DecodedOAuthIdToken extends S.TaggedClass<DecodedOAuthIdToken>()(
  "DecodedOAuthIdToken",
  {
    ...DecodedOAuthTokenCommonFields,
    ...OAuthUserInfoFields
  }
) {}

class DecodedSessionAccessToken extends S.Class<DecodedSessionAccessToken>("DecodedSessionAccessToken")(
  {
    _tag: pipe(
      S.tag("DecodedSessionAccessToken"),
      S.withDecodingDefaultKey(Effect.succeed("DecodedSessionAccessToken" as const))
    ),

    ...DecodedAccessTokenCommonFields,

    sub: UserId,
    act: pipe(
      S.Struct({ sub: EmailAddress }),
      S.optional
    ),
    roles: S.NonEmptyArray(S.Trimmed.check(S.isNonEmpty())),
    permissions: pipe(
      S.Array(S.Trimmed.check(S.isNonEmpty())),
      S.optional
    ),
    entitlements: pipe(
      S.Array(S.Trimmed.check(S.isNonEmpty())),
      S.optional
    ),
    sid: S.Trimmed.check(S.isNonEmpty())
  }
) {}

const DecodedAccessTokenFromWire = S.Union([
  pipe(DecodedMachineAccessToken, S.encodeKeys(DecodedAccessTokenCommonKeys)),
  pipe(DecodedOAuthAccessToken, S.encodeKeys(DecodedAccessTokenCommonKeys)),
  pipe(DecodedSessionAccessToken, S.encodeKeys(DecodedAccessTokenCommonKeys))
])

const DecodedOAuthIdTokenFromWire = pipe(
  DecodedOAuthIdToken,
  S.encodeKeys({
    ...DecodedAccessTokenCommonKeys,
    ...OAuthUserInfoKeys
  })
)

class ExpiredTokenError extends S.TaggedError<ExpiredTokenError>("@effect/auth-workos/ExpiredTokenError")(
  "ExpiredTokenError",
  {
    cause: S.Defect(),
    token: S.Trimmed.check(S.isNonEmpty())
  }
) {}
class InvalidTokenError extends S.TaggedError<InvalidTokenError>("@effect/auth-workos/InvalidUrlError")(
  "InvalidTokenError",
  {
    cause: S.Defect(),
    token: S.Trimmed.check(S.isNonEmpty())
  }
) {}

type JWKsAsEffect = Effect.Effect<
  (protectedHeader?: Jose.JWSHeaderParameters, token?: Jose.FlattenedJWSInput) => Promise<Jose.CryptoKey>,
  HttpClientError.HttpClientError
>

export interface Client {
  readonly jwks: JWKsAsEffect

  readonly decodeAccessToken: (
    token: AccessToken
  ) => Effect.Effect<
    DecodedMachineAccessToken | DecodedOAuthAccessToken | DecodedSessionAccessToken,
    HttpClientError.HttpClientError | InvalidTokenError | S.SchemaError
  >

  readonly decodeIdToken: (
    token: IdToken
  ) => Effect.Effect<
    DecodedOAuthIdToken,
    HttpClientError.HttpClientError | InvalidTokenError | S.SchemaError
  >

  readonly verifyAccessToken: (
    token: AccessToken
  ) => Effect.Effect<
    DecodedMachineAccessToken | DecodedOAuthAccessToken | DecodedSessionAccessToken,
    HttpClientError.HttpClientError | ExpiredTokenError | InvalidTokenError | S.SchemaError
  >

  readonly verifyIdToken: (
    token: IdToken
  ) => Effect.Effect<
    DecodedOAuthIdToken,
    HttpClientError.HttpClientError | ExpiredTokenError | InvalidTokenError | S.SchemaError
  >
}

export const make = (jwks: JWKsAsEffect): Client => {
  return {
    jwks,
    decodeAccessToken: (token: AccessToken) =>
      pipe(
        Effect.try({
          try: () => Jose.decodeJwt(token),
          catch: (e) => InvalidTokenError.make({ cause: e, token })
        }),
        Effect.andThen(
          S.decodeUnknownEffect(DecodedAccessTokenFromWire)
        )
      ),
    decodeIdToken: (token: IdToken) =>
      pipe(
        Effect.try({
          try: () => Jose.decodeJwt(token),
          catch: (e) => InvalidTokenError.make({ cause: e, token })
        }),
        Effect.andThen(S.decodeUnknownEffect(DecodedOAuthIdTokenFromWire))
      ),
    verifyAccessToken: Effect.fnUntraced(function*(token: AccessToken) {
      const now = yield* DateTime.nowAsDate

      return yield* pipe(
        jwks,
        Effect.flatMap((_) =>
          Effect.tryPromise({
            try: () => Jose.jwtVerify(token, _, { currentDate: now }),
            catch: (e) => {
              if (e instanceof Jose.errors.JWTExpired) {
                return ExpiredTokenError.make({ cause: e, token })
              }

              return InvalidTokenError.make({ cause: e, token })
            }
          })
        ),
        Effect.map(({ payload }) => payload),
        Effect.andThen(
          S.decodeUnknownEffect(DecodedAccessTokenFromWire)
        )
      )
    }),
    verifyIdToken: Effect.fnUntraced(function*(token: IdToken) {
      const now = yield* DateTime.nowAsDate

      return yield* pipe(
        jwks,
        Effect.flatMap((_) =>
          Effect.tryPromise({
            try: () => Jose.jwtVerify(token, _, { currentDate: now }),
            catch: (e) => {
              if (e instanceof Jose.errors.JWTExpired) {
                return ExpiredTokenError.make({ cause: e, token })
              }

              return InvalidTokenError.make({ cause: e, token })
            }
          })
        ),
        Effect.map(({ payload }) => payload),
        Effect.andThen(S.decodeUnknownEffect(DecodedOAuthIdTokenFromWire))
      )
    })
  }
}
