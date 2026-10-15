import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeServices from "@effect/platform-node/NodeServices"
import { PostgresDefaults } from "@one-kilo/sql/configs/Defaults"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ChildProcess from "effect/process/ChildProcess"
import * as ChildProcessSpawner from "effect/process/ChildProcessSpawner"
import * as Schedule from "effect/Schedule"
import * as S from "effect/Schema"

const docker = (...args: Array<string>) => ChildProcess.make("docker", args)

const exitCode = (command: ChildProcess.Command) =>
  Effect.flatMap(ChildProcessSpawner.ChildProcessSpawner, (spawner) => spawner.exitCode(command))

const outputString = (command: ChildProcess.Command) =>
  Effect.flatMap(ChildProcessSpawner.ChildProcessSpawner, (spawner) => spawner.string(command))

const POSTGRES_IMAGE = "postgres:18.2"
const CONTAINER_NAME = "local-one-kilo-postgres"

class DockerCommandError extends S.TaggedError<DockerCommandError>("@one-kilo/local-dev/DockerCommandError")(
  "DockerCommandError",
  {
    message: S.String,
    exitCode: S.Int
  }
) {}

const isContainerRunning = Effect.gen(function*() {
  const cmd = docker("inspect", "--format", "{{.State.Running}}", CONTAINER_NAME)
  const code = yield* pipe(cmd, exitCode)
  if (code !== 0) return false
  const output = yield* pipe(cmd, outputString)
  return output.trim() === "true"
}).pipe(Effect.orElseSucceed(() => false))

const doesContainerExist = pipe(
  docker("inspect", CONTAINER_NAME),
  exitCode,
  Effect.map((code) => code === 0)
)

const startExistingContainer = Effect.gen(function*() {
  const code = yield* pipe(
    docker("start", CONTAINER_NAME),
    exitCode
  )
  if (code !== 0) {
    return yield* new DockerCommandError({
      message: `Failed to start container '${CONTAINER_NAME}' (exit code ${code})`,
      exitCode: code
    })
  }
  yield* Effect.log(`Started existing container '${CONTAINER_NAME}'`)
})

const ensureImagePulled = Effect.gen(function*() {
  const inspectCode = yield* pipe(
    docker("image", "inspect", POSTGRES_IMAGE),
    exitCode
  )
  if (inspectCode === 0) return
  yield* Effect.log(`Pulling ${POSTGRES_IMAGE}...`)
  const pullCode = yield* pipe(
    docker("pull", POSTGRES_IMAGE),
    exitCode
  )
  if (pullCode !== 0) {
    return yield* new DockerCommandError({
      message: `Failed to pull ${POSTGRES_IMAGE} (exit code ${pullCode})`,
      exitCode: pullCode
    })
  }
})

const createContainer = Effect.gen(function*() {
  yield* ensureImagePulled
  const code = yield* pipe(
    docker(
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
    exitCode
  )
  if (code !== 0) {
    return yield* new DockerCommandError({
      message: `Failed to create container '${CONTAINER_NAME}' (exit code ${code})`,
      exitCode: code
    })
  }
  yield* Effect.log(`Created and started container '${CONTAINER_NAME}'`)
})

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
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- script entry point
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
)
