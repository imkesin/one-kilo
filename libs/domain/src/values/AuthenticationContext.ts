import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"

export const AuthenticationIdentity = pipe(
  S.Struct({
    userId: UserId,
    workspaceId: WorkspaceId
  }),
  S.annotations({
    description: "The unique combination of user and workspace that scopes an authentication",
    identifier: "AuthenticationIdentity",
    title: "Authentication Identity"
  })
)
export type AuthenticationIdentity = typeof AuthenticationIdentity.Type

export const AuthenticationTokens = pipe(
  S.Struct({
    workosAccessToken: WorkOSValues.AccessToken,
    workosRefreshToken: WorkOSValues.RefreshToken
  }),
  S.annotations({
    description: "The tokens associated with an authenticated user",
    identifier: "AuthenticationTokens",
    title: "Authentication Tokens"
  })
)

export const AuthenticationContext = pipe(
  S.extend(
    AuthenticationIdentity,
    AuthenticationTokens
  ),
  S.annotations({
    description: "The base context for an authenticated user",
    identifier: "AuthenticationContext",
    title: "Authentication Context"
  })
)
export type AuthenticationContext = typeof AuthenticationContext.Type
