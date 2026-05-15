import * as Activity from "@effect/workflow/Activity"
import * as DurableClock from "@effect/workflow/DurableClock"
import type { WorkflowEngine, WorkflowInstance } from "@effect/workflow/WorkflowEngine"
import * as Cause from "effect/Cause"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import type * as Scope from "effect/Scope"

const BASE_DURATION = Duration.seconds(5)
const BACKOFF_FACTOR = 2
const MAX_DURATION = Duration.hours(1)

const MAX_ATTEMPTS = 20

export class RetryBudgetExhausted extends S.TaggedError<RetryBudgetExhausted>()(
  "@one-kilo/activity/RetryBudgetExhausted",
  {
    activityName: S.NonEmptyTrimmedString,
    attemptCount: S.Int,
    latestError: S.Defect
  }
) {}

type DurableRetryOptions<E> = {
  readonly name: string
  /**
   * If not provided, the activity will retry indefinitely (until the
   * max-attempts budget is exhausted).
   */
  readonly while?: ((e: E) => boolean) | undefined
}

/**
 * An improvement over the built-in `Activity.retry`.
 *
 * Retries the wrapped effect with capped exponential backoff. On retryable
 * failures, gives up after `MAX_ATTEMPTS` and fails with `RetryBudgetExhausted`
 * carrying the last underlying error.
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

      const failure = Cause.failureOption(exit.cause)

      const isRetryable = Option.match(
        failure,
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

      if (!isRetryable) {
        return yield* exit
      }

      if (attempt >= MAX_ATTEMPTS) {
        return yield* RetryBudgetExhausted.make({
          activityName: options.name,
          attemptCount: attempt,
          latestError: Option.getOrUndefined(failure)
        })
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
    readonly execute: Effect.Effect<Success["Type"], Error["Type"], R>
    readonly success?: Success
    readonly error: Error
    readonly while?: (error: Error["Type"]) => boolean
  }
): Activity.Activity<
  Success,
  S.Union<[Error, typeof RetryBudgetExhausted]>,
  Exclude<
    R,
    Activity.CurrentAttempt | WorkflowEngine | WorkflowInstance | Scope.Scope
  >
> => {
  return Activity.make({
    name: options.name,
    success: options.success,
    error: S.Union(options.error, RetryBudgetExhausted),
    execute: pipe(
      options.execute,
      retryDurable({
        name: options.name,
        while: options.while
      })
    )
  })
}
