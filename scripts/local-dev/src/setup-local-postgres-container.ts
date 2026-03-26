import * as NodeContext from "@effect/platform-node/NodeContext"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as Command from "@effect/platform/Command"
import { PostgresDefaults } from "@one-kilo/sql/configs/Defaults"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Schedule from "effect/Schedule"

const POSTGRES_IMAGE = "postgres:18.2"
const CONTAINER_NAME = "local-one-kilo-postgres"

const isContainerRunning = Effect.gen(function*() {
  const cmd = Command.make("docker", "inspect", "--format", "{{.State.Running}}", CONTAINER_NAME)
  const code = yield* pipe(cmd, Command.exitCode)
  if (code !== 0) return false
  const output = yield* pipe(cmd, Command.string())
  return output.trim() === "true"
}).pipe(Effect.orElseSucceed(() => false))

const doesContainerExist = pipe(
  Command.make("docker", "inspect", CONTAINER_NAME),
  Command.exitCode,
  Effect.map((code) => code === 0)
)

const startExistingContainer = Effect.gen(function*() {
  const code = yield* pipe(
    Command.make("docker", "start", CONTAINER_NAME),
    Command.exitCode
  )
  if (code !== 0) {
    return yield* Effect.fail(new Error(`Failed to start container '${CONTAINER_NAME}' (exit code ${code})`))
  }
  yield* Effect.log(`Started existing container '${CONTAINER_NAME}'`)
})

const ensureImagePulled = Effect.gen(function*() {
  const inspectCode = yield* pipe(
    Command.make("docker", "image", "inspect", POSTGRES_IMAGE),
    Command.exitCode
  )
  if (inspectCode === 0) return
  yield* Effect.log(`Pulling ${POSTGRES_IMAGE}...`)
  const pullCode = yield* pipe(
    Command.make("docker", "pull", POSTGRES_IMAGE),
    Command.exitCode
  )
  if (pullCode !== 0) {
    return yield* Effect.fail(new Error(`Failed to pull ${POSTGRES_IMAGE} (exit code ${pullCode})`))
  }
})

const createContainer = Effect.gen(function*() {
  yield* ensureImagePulled
  const code = yield* pipe(
    Command.make(
      "docker",
      "run",
      "--name",
      CONTAINER_NAME,
      "--env",
      `POSTGRES_USER=${PostgresDefaults.user}`,
      "--env",
      `POSTGRES_PASSWORD=${PostgresDefaults.password}`,
      "--env",
      `POSTGRES_DB=${PostgresDefaults.localDB}`,
      "--publish",
      `${PostgresDefaults.port}:5432`,
      "--detach",
      POSTGRES_IMAGE
    ),
    Command.exitCode
  )
  if (code !== 0) {
    return yield* Effect.fail(new Error(`Failed to create container '${CONTAINER_NAME}' (exit code ${code})`))
  }
  yield* Effect.log(`Created and started container '${CONTAINER_NAME}'`)
})

const waitForPostgres = pipe(
  Command.make("docker", "exec", CONTAINER_NAME, "pg_isready", "--username", PostgresDefaults.user),
  Command.exitCode,
  Effect.flatMap((code) =>
    code === 0
      ? Effect.void
      : Effect.fail(new Error(`pg_isready exited with code ${code}`))
  ),
  Effect.retry({
    times: 30,
    schedule: Schedule.spaced(Duration.seconds(1))
  }),
  Effect.tap(() => Effect.log("Postgres is ready"))
)

const createDatabase = (name: string) =>
  pipe(
    Command.make(
      "docker",
      "exec",
      CONTAINER_NAME,
      "psql",
      "--username",
      PostgresDefaults.user,
      "--command",
      `CREATE DATABASE ${name};`
    ),
    Command.exitCode,
    Effect.flatMap((code) =>
      code === 0
        ? Effect.log(`Created '${name}' database`)
        : Effect.log(`'${name}' database already exists`)
    )
  )

const main = Effect.gen(function*() {
  yield* Effect.log("Setting up Postgres...")

  const running = yield* isContainerRunning
  if (running) {
    yield* Effect.log(`Container '${CONTAINER_NAME}' is already running`)
  } else {
    const exists = yield* doesContainerExist
    if (exists) {
      yield* startExistingContainer
    } else {
      yield* createContainer
    }
    yield* waitForPostgres
  }

  yield* createDatabase(PostgresDefaults.testDB)
  yield* Effect.log("Postgres setup complete")
})

pipe(
  main,
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
