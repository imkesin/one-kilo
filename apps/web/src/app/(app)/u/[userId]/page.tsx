import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"

const userPageEffect = pipe(
  Effect.succeed(
    <div>
      <h1>(Unsecured) User Page</h1>
    </div>
  )
)

export default async function UserPage() {
  return runWithWebServerRuntime(userPageEffect)
}
