import { Atom, Result } from "@effect-atom/atom-react"
import { orFailWithUnexpectedError, UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { AccountsApi_MeSchemas } from "@one-kilo/server-api/modules/accounts/AccountsApiSchemas"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { WebApiClient } from "~/infra/api/WebApiClient"
import { makeAtomRuntime } from "~/infra/runtime/client/atomRuntime"

const runtime = makeAtomRuntime(WebApiClient.Default)

const meAtomSource = pipe(
  runtime.atom(
    Effect.fn(function*() {
      const webApiClient = yield* WebApiClient

      return yield* pipe(
        webApiClient.accounts.me(),
        orFailWithUnexpectedError("Failed to load GET /accounts/me")
      )
    })
  ),
  Atom.serializable({
    key: "/accounts/me",
    schema: Result.Schema({
      success: AccountsApi_MeSchemas.Success,
      error: UnexpectedError
    })
  })
)

export const meAtomInitialValue = (success: typeof AccountsApi_MeSchemas.Success.Type) =>
  Atom.initialValue(
    meAtomSource,
    Result.success(success)
  )

/*
 * `Atom.refreshOnWindowFocus` is a transformation that install a listener inside the
 * read; it must wrap a separate, non-serialized node.
 */
export const meAtom = Atom.refreshOnWindowFocus(meAtomSource)
