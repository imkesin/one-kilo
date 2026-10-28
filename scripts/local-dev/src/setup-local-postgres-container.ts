import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeServices from "@effect/platform-node/NodeServices"
import { PostgresDefaults } from "@one-kilo/sql/configs/Defaults"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Schedule from "effect/Schedule"
import { docker, DockerCommandError, ensureContainerRunning, exitCode } from "./Docker.ts"

const POSTGRES_IMAGE = "postgres:18.2"
const CONTAINER_NAME = "local-one-kilo-postgres"

const waitForPostgres = pipe(
  docker("exec", CONTAINER_NAME, "pg_isready", "--username", PostgresDefaults.user),
  exitCode,
  Effect.flatMap((code) =>
    code === 0
      ? Effect.void
      : Effect.fail(new DockerCommandError({ message: `pg_isready exited with code ${code}`, exitCode: code }))
  ),
  Effect.retry({
    times: 30,
    schedule: Schedule.spaced(Duration.seconds(1))
  }),
  Effect.tap(() => Effect.log("Postgres is ready"))
)

const createDatabase = (name: string) =>
  pipe(
    docker(
      "exec",
      CONTAINER_NAME,
      "psql",
      "--username",
      PostgresDefaults.user,
      "--command",
      `CREATE DATABASE ${name};`
    ),
    exitCode,
    Effect.flatMap((code) =>
      code === 0
        ? Effect.log(`Created '${name}' database`)
        : Effect.log(`'${name}' database already exists`)
    )
  )

const main = Effect.gen(function*() {
  yield* Effect.log("Setting up Postgres...")

  yield* ensureContainerRunning({
    name: CONTAINER_NAME,
    image: POSTGRES_IMAGE,
    runArgs: [
      "--env",
      `POSTGRES_USER=${PostgresDefaults.user}`,
      "--env",
      `POSTGRES_PASSWORD=${PostgresDefaults.password}`,
      "--env",
      `POSTGRES_DB=${PostgresDefaults.localDB}`,
      "--publish",
      `${PostgresDefaults.port}:5432`
    ],
    waitUntilReady: waitForPostgres
  })

  yield* createDatabase(PostgresDefaults.testDB)
  yield* Effect.log("Postgres setup complete")
})

pipe(
  main,
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- script entry point
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
)
