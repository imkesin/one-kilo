import { orFailWithUnexpectedError, UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { WhoAmIApiSchemas } from "@one-kilo/server-api/modules/whoami/WhoAmIApiSchemas"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as AsyncResult from "effect/reactivity/AsyncResult"
import * as Atom from "effect/reactivity/Atom"
import { WebApiClient } from "~/infra/api/WebApiClient"
import { makeAtomRuntime } from "~/infra/runtime/client/atomRuntime"

const runtime = makeAtomRuntime(WebApiClient.layer)

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
    schema: AsyncResult.Schema({
      success: WhoAmIApiSchemas.Success,
      error: UnexpectedError
    })
  })
)

export const whoamiAtomInitialValue = (success: typeof WhoAmIApiSchemas.Success.Type) =>
  Atom.initialValue(
    whoamiAtomSource,
    AsyncResult.success(success)
  )

/*
 * `Atom.refreshOnWindowFocus` is a transformation that install a listener inside the
 * read; it must wrap a separate, non-serialized node.
 */
export const whoamiAtom = Atom.refreshOnWindowFocus(whoamiAtomSource)
