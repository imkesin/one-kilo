import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"

export const AuthenticationContext = pipe(
  S.Struct({
    userId: UserId,
    workspaceId: WorkspaceId,
    workosAccessToken: WorkOSValues.AccessToken,
    workosRefreshToken: WorkOSValues.RefreshToken
  }),
  S.annotations({
    description: "The base context for an authenticated user",
    identifier: "AuthenticationContext",
    title: "Authentication Context"
  })
)
export type AuthenticationContext = typeof AuthenticationContext.Type
