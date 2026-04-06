import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as Jose from "jose"
import type { ApplicationClientId, OrganizationId, SessionId, UserId } from "../domain/Ids.ts"
import { AccessToken, RefreshToken } from "../domain/Values.ts"
import { generateRandomString } from "./lib/RandomString.ts"

class GenerateTokenError extends S.TaggedError<GenerateTokenError>("@effect/auth-workos/GenerateTokenError")(
  "GenerateTokenError",
  {
    cause: S.Defect
  }
) {}

export interface Generator {
  readonly generateMachineAccessToken: (parameters: {
    readonly clientId: ApplicationClientId
    readonly organizationId: OrganizationId
  }) => Effect.Effect<AccessToken, GenerateTokenError>

  readonly generateSessionAccessToken: (parameters: {
    readonly userId: UserId
    readonly organizationId?: OrganizationId
    readonly sessionId?: SessionId
  }) => Effect.Effect<AccessToken, GenerateTokenError>

  readonly generateRefreshToken: () => Effect.Effect<RefreshToken>
}

export const makeTest = (
  options: {
    readonly authKitDomain: string
    readonly privateKey: Jose.CryptoKey
  }
): Generator => {
  const ALG = "RS256"
  const DEFAULT_DURATION = Duration.seconds(30)

  const CONNECT_ISS = `https://${options.authKitDomain}`
  const CORE_ISS = "https://api.workos.com"

  return {
    generateMachineAccessToken: Effect.fnUntraced(function*({ clientId, organizationId }) {
      const issuedAt = yield* DateTime.nowAsDate
      const tokenId = generateRandomString("Id")

      return yield* pipe(
        Effect.tryPromise({
          try: () =>
            new Jose.SignJWT({ org_id: organizationId })
              .setProtectedHeader({
                alg: ALG,
                typ: "JWT"
              })
              .setIssuer(CONNECT_ISS)
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

    generateRefreshToken: () => Effect.succeed(RefreshToken.make(generateRandomString("RefreshToken"))),

    generateSessionAccessToken: Effect.fnUntraced(function*({
      userId,
      organizationId,
      sessionId: inputSessionId
    }) {
      const issuedAt = yield* DateTime.nowAsDate

      const sessionId = inputSessionId ?? generateRandomString("Id")
      const tokenId = generateRandomString("Id")

      return yield* pipe(
        Effect.tryPromise({
          try: () =>
            new Jose.SignJWT({
              org_id: organizationId,
              roles: ["member"],
              sid: sessionId
            })
              .setProtectedHeader({
                alg: ALG,
                typ: "JWT"
              })
              .setIssuer(CORE_ISS)
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
