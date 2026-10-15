import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { ApplicationClientId } from "../../domain/Ids.ts"
import { LiteralWithEncodingDefault } from "../CommonDefinitions.ts"
import { AuthorizeScopeFromSet } from "../oauth2/OAuth2ClientDefinitionSchemas.ts"

export const BuildAuthorizeUrlParameters = pipe(
  S.Struct({
    clientId: ApplicationClientId,
    nonce: S.Trimmed.check(S.isNonEmpty()),
    redirectUri: S.Trimmed.check(S.isNonEmpty()),
    responseType: LiteralWithEncodingDefault("code"),
    scope: AuthorizeScopeFromSet,

    state: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    codeChallenge: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    codeChallengeMethod: pipe(
      S.Literal("S256"),
      S.optional
    )
  }),
  S.encodeKeys({
    clientId: "client_id",
    redirectUri: "redirect_uri",
    responseType: "response_type",
    codeChallenge: "code_challenge",
    codeChallengeMethod: "code_challenge_method"
  })
)
export type BuildAuthorizeUrlParameters = typeof BuildAuthorizeUrlParameters.Type
