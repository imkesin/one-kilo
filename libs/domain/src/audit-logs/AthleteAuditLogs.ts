import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { AthleteId } from "../ids/AthleteId.ts"
import { AthleteVersion } from "../versions/AthleteVersion.ts"
import * as AuditBuilder from "./AuditBuilder.ts"

const AthleteAuditLogBuilder = AuditBuilder.make({
  id: AthleteId,
  type: "Athlete",
  version: AthleteVersion
})

export class AthleteCreatedAuditLog extends S.Class<AthleteCreatedAuditLog>("@one-kilo/domain/AthleteCreatedAuditLog")(
  AthleteAuditLogBuilder.Audit({ type: "Athlete.Created" }),
  {
    title: "Athlete Created Audit Log",
    description: "A log marking the registration of a person as an athlete"
  }
) {
  static build = Effect.fnUntraced(
    function*(parameters: Omit<AthleteCreatedAuditLog, "timestamp" | "traceId" | "type" | "schemaVersion">) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return AthleteCreatedAuditLog.make({ timestamp, traceId, ...parameters })
    }
  )
}
