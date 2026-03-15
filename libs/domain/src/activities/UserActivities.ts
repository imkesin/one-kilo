import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import * as ActivityBuilder from "./ActivityBuilder.ts"

const UserActivityBuilder = ActivityBuilder.make({
  id: UserId,
  type: "User"
})

export class UserCreatedActivity extends S.Class<UserCreatedActivity>("@one-kilo/domain/UserCreatedActivity")(
  UserActivityBuilder.Activity("User.Created"),
  {
    title: "User Created Activity",
    description: "An event marking the creation of a user"
  }
) {
  static build = Effect.fnUntraced(
    function*(parameters: Omit<typeof UserCreatedActivity.Type, "timestamp" | "traceId" | "type" | "version">) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return UserCreatedActivity.make({ timestamp, traceId, ...parameters })
    }
  )
}
