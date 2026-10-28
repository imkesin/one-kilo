import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeServices from "@effect/platform-node/NodeServices"
import { OtlpDefaults } from "@one-kilo/telemetry/configs/Defaults"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Schedule from "effect/Schedule"
import { docker, DockerCommandError, ensureContainerRunning, exitCode } from "./Docker.ts"

const LGTM_IMAGE = "grafana/otel-lgtm:0.38.1"
const CONTAINER_NAME = "local-one-kilo-otel-lgtm"

/*
 * The image's `run-all.sh` writes this file once the collector, Grafana, Loki, Tempo, and Prometheus all report ready.
 */
const READY_FILE = "/tmp/ready"

const waitForLgtm = pipe(
  docker("exec", CONTAINER_NAME, "test", "-f", READY_FILE),
  exitCode,
  Effect.flatMap((code) =>
    code === 0
      ? Effect.void
      : Effect.fail(new DockerCommandError({ message: `${READY_FILE} not present yet`, exitCode: code }))
  ),
  Effect.retry({
    times: 120,
    schedule: Schedule.spaced(Duration.seconds(1))
  }),
  Effect.tap(() => Effect.log("OTel LGTM stack is ready"))
)

const main = Effect.gen(function*() {
  yield* Effect.log("Setting up OTel LGTM stack...")

  yield* ensureContainerRunning({
    name: CONTAINER_NAME,
    image: LGTM_IMAGE,
    runArgs: [
      "--publish",
      `${OtlpDefaults.port}:4318`,
      "--publish",
      `${OtlpDefaults.grafanaPort}:3000`
    ],
    waitUntilReady: waitForLgtm
  })

  yield* Effect.log(`OTLP HTTP: http://${OtlpDefaults.host}:${OtlpDefaults.port}`)
  yield* Effect.log(`Grafana: http://${OtlpDefaults.host}:${OtlpDefaults.grafanaPort}`)
})

pipe(
  main,
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- script entry point
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
)
