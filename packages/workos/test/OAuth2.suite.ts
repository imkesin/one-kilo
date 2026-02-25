import { expect, type Vitest } from "@effect/vitest"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Redacted from "effect/Redacted"
import { ApplicationClientId } from "../src/domain/Ids.ts"
import * as OAuth2Gateway from "../src/OAuth2Gateway.ts"
import * as TokenClient from "../src/TokenClient.ts"

export interface TestSuiteContext {
  readonly machineClientId: ApplicationClientId
  readonly machineClientSecret: Redacted.Redacted<string>
}

export class OAuth2TestSuiteContext extends Context.Tag(
  "@effect/auth-workos/OAuth2TestSuiteContext"
)<OAuth2TestSuiteContext, TestSuiteContext>() {}

export const makeOAuth2Tests = () =>
(
  it: Vitest.MethodsNonLive<
    OAuth2Gateway.OAuth2Gateway | TokenClient.TokenClient | OAuth2TestSuiteContext,
    boolean
  >
) => {
  it.effect("a live token can be decoded and verified", () =>
    Effect.gen(function*() {
      const { client: oauth2Client } = yield* OAuth2Gateway.OAuth2Gateway
      const { client: tokenClient } = yield* TokenClient.TokenClient

      const { machineClientId, machineClientSecret } = yield* OAuth2TestSuiteContext

      const { accessToken } = yield* oauth2Client.retrieveTokenByClientCredentials({
        clientId: machineClientId,
        clientSecret: machineClientSecret
      })

      const decoded = yield* tokenClient.decodeAccessToken(accessToken)

      if (decoded._tag !== "DecodedMachineAccessToken") {
        expect.fail("Expected a machine token, but received another variant")
      }

      expect(decoded.sub).toEqual(machineClientId)

      const verified = yield* tokenClient.verifyAccessToken(accessToken)

      if (verified._tag !== "DecodedMachineAccessToken") {
        expect.fail("Expected a machine token, but received another variant")
      }

      expect(verified.sub).toEqual(machineClientId)
    }))
}
