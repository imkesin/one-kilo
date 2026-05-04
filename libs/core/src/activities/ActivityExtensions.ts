import * as Activity from "@effect/workflow/Activity"
import * as DurableClock from "@effect/workflow/DurableClock"
import * as Cause from "effect/Cause"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"

const BASE_DURATION = Duration.seconds(5)
const BACKOFF_FACTOR = 2
const MAX_DURATION = Duration.hours(1)

type DurableRetryOptions<E> = {
  readonly name: string
  /**
   * If not provided, the activity will retry indefinitely
   */
  readonly while?: (e: E) => boolean
}

/**
 * An improvement over the built-in `Activity.retry`
 */
const retryDurable = <A, E, R>(options: DurableRetryOptions<E>) => (effect: Effect.Effect<A, E, R>) =>
  Effect.gen(function*() {
    let attempt = 1

    while (true) {
      const exit = yield* pipe(
        Effect.provideService(effect, Activity.CurrentAttempt, attempt),
        Effect.exit
      )

      if (Exit.isSuccess(exit)) {
        return exit.value
      }

      const isRetryable = pipe(
        Cause.failureOption(exit.cause),
        Option.match(
          {
            onSome: (error) => {
              if (options.while === undefined) {
                return true
              }

              return options.while(error)
            },
            onNone: () => false
          }
        )
      )

      if (!isRetryable) {
        return yield* exit
      }

      const exponent = Math.min(attempt - 1, 10)
      const sleepDuration = pipe(
        BASE_DURATION,
        Duration.times(BACKOFF_FACTOR ** exponent),
        Duration.min(MAX_DURATION)
      )

      yield* DurableClock.sleep({
        name: `${options.name}/backoff/${attempt}`,
        duration: sleepDuration
      })

      attempt++
    }
  })

export const makeWithDurableRetry = <
  R,
  Success extends S.Schema.Any = typeof S.Void,
  Error extends S.Schema.All = typeof S.Never
>(
  options: {
    readonly name: string
    readonly success?: Success
    readonly error?: Error
    readonly execute: Effect.Effect<Success["Type"], Error["Type"], R>
  }
) =>
  Activity.make({
    name: options.name,
    success: options.success,
    error: options.error,
    execute: pipe(
      options.execute,
      retryDurable({ name: options.name })
    )
  })
