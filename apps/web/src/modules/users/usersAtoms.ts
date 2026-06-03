import { Atom, Result } from "@effect-atom/atom-react"
import { UsersApi_MeSchemas } from "@one-kilo/server-api/modules/users/UsersApiSchemas"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { WebApiClient } from "~/infra/api/WebApiClient"
import { makeAtomRuntime } from "~/infra/runtime/client/atomRuntime"
import { Users_UnauthenticatedError } from "./api/UsersWebApiErrors"

const runtime = makeAtomRuntime(WebApiClient.Default)

export const meAtom = pipe(
  runtime.atom(
    pipe(
      WebApiClient,
      Effect.flatMap(({ client }) => client.users.me()),
      /*
       * TODO - This could be better
       */
      Effect.catchAll((error) =>
        error instanceof Users_UnauthenticatedError
          ? Effect.fail(error)
          : Effect.die(error)
      )
    )
  ),
  Atom.refreshOnWindowFocus,
  Atom.serializable({
    key: "/users/me",
    schema: Result.Schema({
      success: UsersApi_MeSchemas.Success,
      error: Users_UnauthenticatedError
    })
  }),
  Atom.withServerValueInitial
)

export const meAtomInitialValue = (success: typeof UsersApi_MeSchemas.Success.Type) =>
  Atom.initialValue(
    meAtom,
    Result.success(success)
  )
