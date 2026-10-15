import * as Arr from "effect/Array"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaTransformation from "effect/SchemaTransformation"
import { Event, EventFromWire } from "../../domain/Entities.ts"
import { EventId } from "../../domain/Ids.ts"
import { EventType } from "../../domain/Values.ts"

/*
 * WorkOS expects a single comma-separated `events` query parameter
 */
const EventTypesQueryParameter = pipe(
  S.String,
  S.decodeTo(
    S.Array(S.String),
    SchemaTransformation.transform({
      decode: (events): ReadonlyArray<string> => events.split(","),
      encode: (events) => Arr.dedupe(events).join(",")
    })
  ),
  S.decodeTo(S.NonEmptyArray(EventType))
)

const ListEventsCommonFields = {
  events: EventTypesQueryParameter,
  limit: pipe(
    S.Int,
    S.check(S.isBetween({ minimum: 1, maximum: 100 })),
    S.optional
  )
}

const ListEventsKeys = {
  rangeStart: "range_start"
} as const

/*
 * WorkOS rejects requests that provide both `range_start` and `after`
 */
export const ListEventsParameters = S.Union([
  pipe(
    S.Struct({
      ...ListEventsCommonFields,
      rangeStart: pipe(
        S.DateFromString,
        S.optional
      ),
      after: S.optional(S.Never)
    }),
    S.encodeKeys(ListEventsKeys)
  ),
  pipe(
    S.Struct({
      ...ListEventsCommonFields,
      rangeStart: S.optional(S.Never),
      after: EventId
    }),
    S.encodeKeys(ListEventsKeys)
  )
])

export const ListEventsResponse = pipe(
  S.Struct({
    data: S.Array(EventFromWire),
    list_metadata: S.Struct({
      after: S.OptionFromOptionalNullOr(EventId)
    })
  }),
  S.decodeTo(
    S.Struct({
      events: S.Array(S.toType(Event)),
      after: S.Option(S.toType(EventId))
    }),
    SchemaTransformation.transform({
      decode: ({ data, list_metadata }) => ({ events: data, after: list_metadata.after }),
      encode: ({ after, events }) => ({ data: events, list_metadata: { after } })
    })
  )
)
export type ListEventsResponse = typeof ListEventsResponse.Type
