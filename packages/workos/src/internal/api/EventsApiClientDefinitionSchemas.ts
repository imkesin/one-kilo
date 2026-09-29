import * as Arr from "effect/Array"
import { identity, pipe } from "effect/Function"
import * as S from "effect/Schema"
import { Event } from "../../domain/Entities.ts"
import { EventId } from "../../domain/Ids.ts"
import { EventType } from "../../domain/Values.ts"

/*
 * WorkOS expects a single comma-separated `events` query parameter
 */
const EventTypesQueryParameter = pipe(
  S.split(","),
  S.compose(
    S.transform(
      S.NonEmptyArray(EventType),
      S.NonEmptyArray(EventType),
      {
        strict: true,
        decode: identity,
        encode: Arr.dedupe
      }
    )
  )
)

const ListEventsCommonFields = {
  events: EventTypesQueryParameter,
  limit: pipe(
    S.Int,
    S.between(1, 100),
    S.optional
  )
}

/*
 * WorkOS rejects requests that provide both `range_start` and `after`
 */
export const ListEventsParameters = S.Union(
  S.Struct({
    ...ListEventsCommonFields,
    rangeStart: pipe(
      S.Date,
      S.optional,
      S.fromKey("range_start")
    ),
    after: S.optional(S.Never)
  }),
  S.Struct({
    ...ListEventsCommonFields,
    rangeStart: S.optional(S.Never),
    after: EventId
  })
)

export const ListEventsResponse = S.transform(
  S.Struct({
    data: S.Array(Event),
    list_metadata: S.Struct({
      after: pipe(
        EventId,
        S.optionalWith({ nullable: true, as: "Option" })
      )
    })
  }),
  S.Struct({
    events: S.Array(S.typeSchema(Event)),
    after: S.OptionFromSelf(S.typeSchema(EventId))
  }),
  {
    strict: true,
    decode: ({ data, list_metadata }) => ({ events: data, after: list_metadata.after }),
    encode: ({ after, events }) => ({ data: events, list_metadata: { after } })
  }
)
export type ListEventsResponse = typeof ListEventsResponse.Type
