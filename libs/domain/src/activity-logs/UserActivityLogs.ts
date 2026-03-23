import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import * as ActivityBuilder from "./ActivityBuilder.ts"

const UserActivityLogBuilder = ActivityBuilder.make({
  id: UserId,
  type: "User"
})

export class UserCreatedActivityLog extends S.Class<UserCreatedActivityLog>("@one-kilo/domain/UserCreatedActivityLog")(
  UserActivityLogBuilder.Activity({ type: "User.Created" }),
  {
    title: "User Created Activity Log",
    description: "A log marking the creation of a user"
  }
) {
  static build = Effect.fnUntraced(
    function*(parameters: Omit<typeof UserCreatedActivityLog.Type, "timestamp" | "traceId" | "type" | "version">) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return UserCreatedActivityLog.make({ timestamp, traceId, ...parameters })
    }
  )
}
