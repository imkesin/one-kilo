import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { ClientId, OrganizationId } from "../../domain/Ids.ts"

export class BuildAuthorizationUrlParameters
  extends S.Class<BuildAuthorizationUrlParameters>("BuildAuthorizationUrlParameters")({
    clientId: pipe(
      ClientId,
      S.propertySignature,
      S.fromKey("client_id")
    ),
    redirectUri: pipe(
      S.NonEmptyTrimmedString,
      S.propertySignature,
      S.fromKey("redirect_uri")
    ),

    responseType: pipe(
      S.requiredToOptional(
        S.Literal("code"),
        S.Literal("code"),
        {
          decode: () => Option.some("code" as const),
          encode: () => "code" as const
        }
      ),
      S.fromKey("response_type")
    ),

    codeChallenge: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.fromKey("code_challenge")
    ),
    codeChallengeMethod: pipe(
      S.Literal("S256"),
      S.optional,
      S.fromKey("code_challenge_method")
    ),
    connectionId: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.fromKey("connection_id")
    ),
    domainHint: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.fromKey("domain_hint")
    ),
    loginHint: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.fromKey("login_hint")
    ),
    organizationId: pipe(
      OrganizationId,
      S.optional,
      S.fromKey("organization_id")
    ),
    provider: pipe(
      S.Literal("authkit", "AppleOAuth", "GitHubOAuth", "GoogleOAuth", "MicrosoftOAuth"),
      S.optional
    ),
    screenHint: pipe(
      S.Literal("sign-up", "sign-in"),
      S.optional,
      S.fromKey("screen_hint")
    ),
    state: pipe(
      S.StringFromBase64Url,
      S.optional
    )
  })
{}
