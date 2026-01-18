import { pipe } from "effect"
import * as S from "effect/Schema"
import { ClientId } from "../../domain/DomainIds.ts"
import { AuthorizeScopeFromSet } from "../OAuth2/OAuth2ClientDefinitionSchemas.ts"

export class BuildAuthorizeUrlParameters extends S.Class<BuildAuthorizeUrlParameters>("BuildAuthorizeUrlParameters")({
  clientId: pipe(
    ClientId,
    S.propertySignature,
    S.fromKey("client_id")
  ),
  nonce: S.NonEmptyTrimmedString,
  redirectUri: pipe(
    S.NonEmptyTrimmedString,
    S.propertySignature,
    S.fromKey("redirect_uri")
  ),
  responseType: pipe(
    S.Literal("code"),
    S.optionalWith({ default: () => "code" }),
    S.fromKey("response_type")
  ),
  scope: AuthorizeScopeFromSet,

  state: pipe(
    S.NonEmptyTrimmedString,
    S.optional
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
  )
}) {}
