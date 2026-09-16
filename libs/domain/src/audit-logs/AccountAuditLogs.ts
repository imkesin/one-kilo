import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { AccountId } from "../ids/AccountId.ts"
import * as AuditBuilder from "./AuditBuilder.ts"

const AccountAuditLogBuilder = AuditBuilder.make({
  id: AccountId,
  type: "Account"
})

export class AccountCreatedAuditLog extends S.Class<AccountCreatedAuditLog>("@one-kilo/domain/AccountCreatedAuditLog")(
  AccountAuditLogBuilder.Audit({ type: "Account.Created" }),
  {
    title: "Account Created Audit Log",
    description: "A log marking the creation of an account"
  }
) {
  static build = Effect.fnUntraced(
    function*(parameters: Omit<typeof AccountCreatedAuditLog.Type, "timestamp" | "traceId" | "type" | "version">) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return AccountCreatedAuditLog.make({ timestamp, traceId, ...parameters })
    }
  )
}
