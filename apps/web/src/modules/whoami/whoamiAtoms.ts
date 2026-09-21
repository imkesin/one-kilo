import { Atom, Result } from "@effect-atom/atom-react"
import { orFailWithUnexpectedError, UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { WhoAmIApiSchemas } from "@one-kilo/server-api/modules/whoami/WhoAmIApiSchemas"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { WebApiClient } from "~/infra/api/WebApiClient"
import { makeAtomRuntime } from "~/infra/runtime/client/atomRuntime"

const runtime = makeAtomRuntime(WebApiClient.Default)

const whoamiAtomSource = pipe(
  runtime.atom(
    Effect.fn(function*() {
      const webApiClient = yield* WebApiClient

      return yield* pipe(
        webApiClient.whoami(),
        orFailWithUnexpectedError("Failed to load GET /whoami")
      )
    })
  ),
  Atom.serializable({
    key: "/whoami",
    schema: Result.Schema({
      success: WhoAmIApiSchemas.Success,
      error: UnexpectedError
    })
  })
)

export const whoamiAtomInitialValue = (success: typeof WhoAmIApiSchemas.Success.Type) =>
  Atom.initialValue(
    whoamiAtomSource,
    Result.success(success)
  )

/*
 * `Atom.refreshOnWindowFocus` is a transformation that install a listener inside the
 * read; it must wrap a separate, non-serialized node.
 */
export const whoamiAtom = Atom.refreshOnWindowFocus(whoamiAtomSource)
