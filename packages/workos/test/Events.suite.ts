import { describe, expect, type Vitest } from "@effect/vitest"
import * as Arr from "effect/Array"
import * as Cause from "effect/Cause"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Schedule from "effect/Schedule"
import * as ApiClient from "../src/ApiClient.ts"
import type { Event } from "../src/domain/Entities.ts"
import type { EventId } from "../src/domain/Ids.ts"
import { EmailAddress } from "../src/domain/Values.ts"

const listUserUpdatedEventsSince = Effect.fn(function*(rangeStart: Date) {
  const client = yield* ApiClient.ApiClient

  const events: Array<Event> = Arr.empty()
  let cursor = Option.none<EventId>()

  while (true) {
    const page = yield* client.events.listEvents(
      Option.match(cursor, {
        onNone: () => ({ events: ["user.updated"], rangeStart, limit: 100 }),
        onSome: (after) => ({ events: ["user.updated"], after, limit: 100 })
      })
    )

    if (page.events.length === 0) {
      return events
    }

    events.push(...page.events)
    cursor = pipe(
      page.after,
      Option.orElse(() =>
        Option.map(
          Arr.last(page.events),
          ({ id }) => id
        )
      )
    )
  }
})

export const makeEventsTests = () => (it: Vitest.MethodsNonLive<ApiClient.ApiClient, boolean>) => {
  describe("Events", () => {
    it.scoped("can list a `user.updated` event after updating a user", () =>
      Effect.gen(function*() {
        const client = yield* ApiClient.ApiClient

        const timestamp = Date.now()
        const testEmail = EmailAddress.make(`test-user-${timestamp}@example.com`)

        const user = yield* client.userManagement.createUser({
          email: testEmail,
          firstName: "Test",
          lastName: "User"
        })

        yield* Effect.addFinalizer(() =>
          pipe(
            client.userManagement.deleteUser(user.id),
            Effect.tapErrorCause((cause) => Effect.logWarning("Failed to delete a user", cause)),
            Effect.ignore
          )
        )

        /*
         * Backdated to tolerate clock skew between this machine and WorkOS
         */
        const rangeStart = pipe(
          yield* DateTime.now,
          DateTime.subtract({ minutes: 1 }),
          DateTime.toDate
        )

        const updatedFirstName = `Updated-${timestamp}`
        yield* client.userManagement.updateUser(user.id, { firstName: updatedFirstName })

        /*
         * WorkOS holds new events back for ~5 seconds before they become visible
         */
        yield* Effect.sleep("5 seconds")

        const event = yield* pipe(
          listUserUpdatedEventsSince(rangeStart),
          Effect.flatMap(Arr.findLast(({ data }) => data.id === user.id)),
          Effect.retry({
            schedule: Schedule.spaced("500 millis"),
            times: 3,
            while: Cause.isNoSuchElementException
          })
        )

        expect(event.event).toEqual("user.updated")
        expect(event.data.email).toEqual(testEmail)
        expect(event.data.firstName).toEqual(updatedFirstName)
      }), 30_000)
  })
}
