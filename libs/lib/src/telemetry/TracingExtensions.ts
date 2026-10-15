import { NoSuchElementError } from "effect/Cause"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import type { AnySpan } from "effect/Tracer"
import { orDieWithUnexpectedError } from "../errors/UnexpectedError.ts"

const nearestNamedSpan = pipe(
  Effect.gen(function*() {
    let activeSpan: AnySpan = yield* Effect.currentParentSpan

    while (activeSpan.traceId === "noop") {
      if (activeSpan._tag === "ExternalSpan" || Option.isNone(activeSpan.parent)) {
        return yield* new NoSuchElementError()
      }

      activeSpan = activeSpan.parent.value
    }

    if (activeSpan._tag !== "Span") {
      return yield* new NoSuchElementError()
    }

    return activeSpan
  }),
  orDieWithUnexpectedError("Failed to find nearest named span")
)

export const nearestTraceId = pipe(
  nearestNamedSpan,
  Effect.map((span) => span.traceId)
)
