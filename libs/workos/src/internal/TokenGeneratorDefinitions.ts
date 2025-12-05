import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as Jose from "jose"
import { AccessToken, type ClientId, type OrganizationId, type SessionId, type UserId } from "../domain/DomainIds.ts"
import { generateUlid } from "../lib/ULID.ts"

class GenerateTokenError extends S.TaggedError<GenerateTokenError>("@effect-workos/workos/GenerateTokenError")(
  "GenerateTokenError",
  {
    cause: S.Defect
  }
) {}

export interface Generator {
  readonly generateMachineAccessToken: (parameters: {
    clientId: ClientId
    orgId: OrganizationId
  }) => Effect.Effect<AccessToken, GenerateTokenError>

  readonly generateSessionToken: (parameters: {
    sessionId: SessionId
    userId: UserId
  }) => Effect.Effect<AccessToken, GenerateTokenError>
}

export const makeTest = (options: { readonly privateKey: Jose.CryptoKey }): Generator => {
  const ALG = "RS256"
  const ISS = "https://api.workos.com"
  const DEFAULT_DURATION = Duration.seconds(5)

  return {
    generateMachineAccessToken: Effect.fnUntraced(function*({ clientId, orgId }) {
      const issuedAt = yield* DateTime.nowAsDate
      const tokenId = generateUlid()

      return yield* pipe(
        Effect.tryPromise({
          try: () =>
            new Jose.SignJWT({ org_id: orgId })
              .setProtectedHeader({
                alg: ALG,
                typ: "JWT"
              })
              .setIssuer(ISS)
              .setSubject(clientId)
              .setExpirationTime(new Date(issuedAt.getTime() + Duration.toMillis(DEFAULT_DURATION)))
              .setIssuedAt(issuedAt)
              .setJti(tokenId)
              .sign(options.privateKey),
          catch: (e) => new GenerateTokenError({ cause: e })
        }),
        Effect.map(AccessToken.make)
      )
    }),

    generateSessionToken: Effect.fnUntraced(function*({ sessionId, userId }) {
      const issuedAt = yield* DateTime.nowAsDate
      const tokenId = generateUlid()

      return yield* pipe(
        Effect.tryPromise({
          try: () =>
            new Jose.SignJWT({ roles: [], sid: sessionId })
              .setProtectedHeader({
                alg: ALG,
                typ: "JWT"
              })
              .setIssuer(ISS)
              .setSubject(userId)
              .setExpirationTime(new Date(issuedAt.getTime() + Duration.toMillis(DEFAULT_DURATION)))
              .setIssuedAt(issuedAt)
              .setJti(tokenId)
              .sign(options.privateKey),
          catch: (e) => new GenerateTokenError({ cause: e })
        }),
        Effect.map(AccessToken.make)
      )
    })
  }
}
