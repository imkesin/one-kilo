import * as ClusterCron from "@effect/cluster/ClusterCron"
import * as Cron from "effect/Cron"
import * as Effect from "effect/Effect"

export const AliveCron = ClusterCron.make({
  name: "runner-alive",
  cron: Cron.unsafeParse("* * * * *"),
  execute: Effect.log("Runner cron: cluster is alive")
})
