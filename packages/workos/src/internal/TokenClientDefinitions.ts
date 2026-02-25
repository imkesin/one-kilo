import * as HttpClientError from "@effect/platform/HttpClientError"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type { ParseError } from "effect/ParseResult"
import * as S from "effect/Schema"
import * as Jose from "jose"
import { ApplicationClientId, OrganizationId, UserId } from "../domain/Ids.ts"
import { AccessToken, EmailAddress, type IdToken } from "../domain/Values.ts"
import { OAuthUserInfoFields } from "./CommonDefinitions.ts"

const DateFromSeconds = S.transform(
  S.Int,
  S.DateFromSelf,
  {
    strict: true,
    decode: (fromA) => new Date(fromA * 1000),
    encode: (toI) => Math.floor(toI.getTime() / 1000)
  }
)

const DecodedAccessTokenCommonFields = {
  iss: S.NonEmptyTrimmedString,
  exp: DateFromSeconds,
  iat: DateFromSeconds
} as const

class DecodedMachineAccessToken extends S.Class<DecodedMachineAccessToken>("DecodedMachineAccessToken")({
  _tag: pipe(
    S.Literal("DecodedMachineAccessToken"),
    S.optional,
    S.withDefaults({
      constructor: () => "DecodedMachineAccessToken" as const,
      decoding: () => "DecodedMachineAccessToken" as const
    })
  ),

  ...DecodedAccessTokenCommonFields,

  sub: ApplicationClientId,
  orgId: pipe(
    OrganizationId,
    S.optional,
    S.fromKey("org_id")
  ),
  jti: S.NonEmptyTrimmedString
}) {}

const DecodedOAuthTokenCommonFields = {
  ...DecodedAccessTokenCommonFields,

  aud: S.NonEmptyTrimmedString,
  sub: UserId
} as const

class DecodedOAuthAccessToken extends S.Class<DecodedOAuthAccessToken>("DecodedOAuthAccessToken")({
  _tag: pipe(
    S.Literal("DecodedOAuthAccessToken"),
    S.optional,
    S.withDefaults({
      constructor: () => "DecodedOAuthAccessToken" as const,
      decoding: () => "DecodedOAuthAccessToken" as const
    })
  ),

  ...DecodedOAuthTokenCommonFields,

  sid: S.NonEmptyTrimmedString,
  jti: S.NonEmptyTrimmedString
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
      S.Literal("DecodedSessionAccessToken"),
      S.optional,
      S.withDefaults({
        constructor: () => "DecodedSessionAccessToken" as const,
        decoding: () => "DecodedSessionAccessToken" as const
      })
    ),

    ...DecodedAccessTokenCommonFields,

    sub: UserId,
    act: pipe(
      S.Struct({ sub: EmailAddress }),
      S.optional
    ),
    orgId: pipe(
      OrganizationId,
      S.optional,
      S.fromKey("org_id")
    ),
    roles: S.Array(S.NonEmptyTrimmedString),
    permissions: pipe(
      S.Array(S.NonEmptyTrimmedString),
      S.optional
    ),
    entitlements: pipe(
      S.Array(S.NonEmptyTrimmedString),
      S.optional
    ),
    sid: S.NonEmptyTrimmedString,
    jti: S.NonEmptyTrimmedString
  }
) {}

class ExpiredTokenError extends S.TaggedError<ExpiredTokenError>("@effect/auth-workos/ExpiredTokenError")(
  "ExpiredTokenError",
  {
    cause: S.Defect,
    token: S.NonEmptyTrimmedString
  }
) {}
class InvalidTokenError extends S.TaggedError<InvalidTokenError>("@effect/auth-workos/InvalidUrlError")(
  "InvalidTokenError",
  {
    cause: S.Defect,
    token: S.NonEmptyTrimmedString
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
    HttpClientError.HttpClientError | InvalidTokenError | ParseError
  >

  readonly decodeIdToken: (
    token: IdToken
  ) => Effect.Effect<
    DecodedOAuthIdToken,
    HttpClientError.HttpClientError | InvalidTokenError | ParseError
  >

  readonly verifyAccessToken: (
    token: AccessToken
  ) => Effect.Effect<
    DecodedMachineAccessToken | DecodedOAuthAccessToken | DecodedSessionAccessToken,
    HttpClientError.HttpClientError | ExpiredTokenError | InvalidTokenError | ParseError
  >

  readonly verifyIdToken: (
    token: IdToken
  ) => Effect.Effect<
    DecodedOAuthIdToken,
    HttpClientError.HttpClientError | ExpiredTokenError | InvalidTokenError | ParseError
  >
}

export const make = (jwks: JWKsAsEffect): Client => {
  return {
    jwks,
    decodeAccessToken: (token: AccessToken) =>
      pipe(
        Effect.try({
          try: () => Jose.decodeJwt(token),
          catch: (e) => new InvalidTokenError({ cause: e, token })
        }),
        Effect.andThen(
          S.decodeUnknown(
            S.Union(
              DecodedMachineAccessToken,
              DecodedOAuthAccessToken,
              DecodedSessionAccessToken
            )
          )
        )
      ),
    decodeIdToken: (token: IdToken) =>
      pipe(
        Effect.try({
          try: () => Jose.decodeJwt(token),
          catch: (e) => new InvalidTokenError({ cause: e, token })
        }),
        Effect.andThen(S.decodeUnknown(DecodedOAuthIdToken))
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
                return new ExpiredTokenError({ cause: e, token })
              }

              return new InvalidTokenError({ cause: e, token })
            }
          })
        ),
        Effect.map(({ payload }) => payload),
        Effect.andThen(
          S.decodeUnknown(
            S.Union(
              DecodedMachineAccessToken,
              DecodedOAuthAccessToken,
              DecodedSessionAccessToken
            )
          )
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
                return new ExpiredTokenError({ cause: e, token })
              }

              return new InvalidTokenError({ cause: e, token })
            }
          })
        ),
        Effect.map(({ payload }) => payload),
        Effect.andThen(S.decodeUnknown(DecodedOAuthIdToken))
      )
    })
  }
}
