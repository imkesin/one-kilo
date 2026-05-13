import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { PersonId } from "../ids/PersonId.ts"
import { FullName, PreferredName } from "../values/PersonValues.ts"
import * as AuditBuilder from "./AuditBuilder.ts"

const PersonAuditLogBuilder = AuditBuilder.make({
  id: PersonId,
  type: "Person"
})

export class PersonUpdatedAuditLog
  extends S.Class<PersonUpdatedAuditLog>("@one-kilo/domain/PersonUpdatedAuditLog")(
    PersonAuditLogBuilder.AuditWithContext({
      type: "Person.Updated",
      context: pipe(
        S.Struct({
          fields: S.Struct({
            preferredName: S.optionalWith(PreferredName, { exact: true }),
            fullName: S.optionalWith(FullName, { exact: true })
          })
        })
      )
    }),
    {
      title: "Person Updated Audit Log",
      description: "A log marking an update to a person's mutable fields"
    }
  )
{
  static build = Effect.fnUntraced(
    function*(
      parameters: Omit<
        typeof PersonUpdatedAuditLog.Type,
        "timestamp" | "traceId" | "type" | "version" | "withEncodedContext"
      >
    ) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return PersonUpdatedAuditLog.make({ timestamp, traceId, ...parameters })
    }
  )

  /**
   * Assumes that context is already a JSON object.
   */
  static decodeContextUnknown = pipe(
    PersonUpdatedAuditLog.fields.context,
    S.decodeUnknown
  )

  static encodeContextSync = pipe(
    PersonUpdatedAuditLog.fields.context,
    (_) => S.parseJson(_),
    S.encodeSync
  )

  withEncodedContext() {
    const { context, ...rest } = this

    return {
      ...rest,
      encodedContext: pipe(
        context,
        PersonUpdatedAuditLog.encodeContextSync,
        Option.some
      )
    }
  }
}
