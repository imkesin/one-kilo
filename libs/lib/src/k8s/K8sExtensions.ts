import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

const K8sConfig = pipe(
  Config.all({
    serviceHost: pipe(
      Config.string("SERVICE_HOST"),
      Config.option
    )
  }),
  Config.nested("KUBERNETES")
)

export const isInK8s = Effect.map(
  K8sConfig,
  ({ serviceHost }) => Option.isSome(serviceHost)
)
