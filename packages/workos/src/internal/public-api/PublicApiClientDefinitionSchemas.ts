import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { EnvironmentClientId, OrganizationId } from "../../domain/Ids.ts"
import { LiteralWithEncodingDefault } from "../CommonDefinitions.ts"

export const BuildAuthorizationUrlParameters = pipe(
  S.Struct({
    clientId: EnvironmentClientId,
    redirectUri: S.Trimmed.check(S.isNonEmpty()),

    responseType: LiteralWithEncodingDefault("code"),

    codeChallenge: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    codeChallengeMethod: pipe(
      S.Literal("S256"),
      S.optional
    ),
    connectionId: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    domainHint: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    loginHint: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),
    organizationId: pipe(
      OrganizationId,
      S.optional
    ),
    provider: pipe(
      S.Literals(["authkit", "AppleOAuth", "GitHubOAuth", "GoogleOAuth", "MicrosoftOAuth"]),
      S.optional
    ),
    screenHint: pipe(
      S.Literals(["sign-up", "sign-in"]),
      S.optional
    ),
    state: pipe(
      S.StringFromBase64Url,
      S.optional
    )
  }),
  S.encodeKeys({
    clientId: "client_id",
    redirectUri: "redirect_uri",
    responseType: "response_type",
    codeChallenge: "code_challenge",
    codeChallengeMethod: "code_challenge_method",
    connectionId: "connection_id",
    domainHint: "domain_hint",
    loginHint: "login_hint",
    organizationId: "organization_id",
    screenHint: "screen_hint"
  })
)
export type BuildAuthorizationUrlParameters = typeof BuildAuthorizationUrlParameters.Type
