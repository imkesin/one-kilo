import { NodeContext, NodeRuntime } from "@effect/platform-node"
import * as Command from "@effect/platform/Command"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Schedule from "effect/Schedule"

const POSTGRES_IMAGE = "postgres:18.2"
const CONTAINER_NAME = "local-one-kilo-postgres"
const POSTGRES_USER = "postgres"
const POSTGRES_PASSWORD = "postgres"
const LOCAL_DB = "one_kilo_local"
const TEST_DB = "one_kilo_test"

const isContainerRunning = Effect.gen(function*() {
  const cmd = Command.make("docker", "inspect", "-f", "{{.State.Running}}", CONTAINER_NAME)
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
      "-e",
      `POSTGRES_USER=${POSTGRES_USER}`,
      "-e",
      `POSTGRES_PASSWORD=${POSTGRES_PASSWORD}`,
      "-e",
      `POSTGRES_DB=${LOCAL_DB}`,
      "-p",
      "5432:5432",
      "-d",
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
  Command.make("docker", "exec", CONTAINER_NAME, "pg_isready", "-U", POSTGRES_USER),
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
      "-U",
      POSTGRES_USER,
      "-c",
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

  yield* createDatabase(TEST_DB)
  yield* Effect.log("Postgres setup complete")
})

pipe(
  main,
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
