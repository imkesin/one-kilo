import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import * as AuditBuilder from "./AuditBuilder.ts"

const UserAuditLogBuilder = AuditBuilder.make({
  id: UserId,
  type: "User"
})

export class UserCreatedAuditLog extends S.Class<UserCreatedAuditLog>("@one-kilo/domain/UserCreatedAuditLog")(
  UserAuditLogBuilder.Audit({ type: "User.Created" }),
  {
    title: "User Created Audit Log",
    description: "A log marking the creation of a user"
  }
) {
  static build = Effect.fnUntraced(
    function*(parameters: Omit<typeof UserCreatedAuditLog.Type, "timestamp" | "traceId" | "type" | "version">) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return UserCreatedAuditLog.make({ timestamp, traceId, ...parameters })
    }
  )
}
