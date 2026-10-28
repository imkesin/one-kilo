import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ChildProcess from "effect/process/ChildProcess"
import * as ChildProcessSpawner from "effect/process/ChildProcessSpawner"
import * as S from "effect/Schema"

export const docker = (...args: Array<string>) => ChildProcess.make("docker", args)

export const exitCode = (command: ChildProcess.Command) =>
  Effect.flatMap(ChildProcessSpawner.ChildProcessSpawner, (spawner) => spawner.exitCode(command))

const outputString = (command: ChildProcess.Command) =>
  Effect.flatMap(ChildProcessSpawner.ChildProcessSpawner, (spawner) => spawner.string(command))

export class DockerCommandError extends S.TaggedError<DockerCommandError>("@one-kilo/local-dev/DockerCommandError")(
  "DockerCommandError",
  {
    message: S.String,
    exitCode: S.Int
  }
) {}

const isContainerRunning = (name: string) =>
  Effect.gen(function*() {
    const cmd = docker("inspect", "--format", "{{.State.Running}}", name)
    const code = yield* pipe(cmd, exitCode)
    if (code !== 0) return false
    const output = yield* pipe(cmd, outputString)
    return output.trim() === "true"
  }).pipe(Effect.orElseSucceed(() => false))

const doesContainerExist = (name: string) =>
  pipe(
    docker("inspect", name),
    exitCode,
    Effect.map((code) => code === 0)
  )

const startExistingContainer = Effect.fnUntraced(function*(name: string) {
  const code = yield* pipe(
    docker("start", name),
    exitCode
  )
  if (code !== 0) {
    return yield* new DockerCommandError({
      message: `Failed to start container '${name}' (exit code ${code})`,
      exitCode: code
    })
  }
  yield* Effect.log(`Started existing container '${name}'`)
})

const ensureImagePulled = Effect.fnUntraced(function*(image: string) {
  const inspectCode = yield* pipe(
    docker("image", "inspect", image),
    exitCode
  )
  if (inspectCode === 0) return
  yield* Effect.log(`Pulling ${image}...`)
  const pullCode = yield* pipe(
    docker("pull", image),
    exitCode
  )
  if (pullCode !== 0) {
    return yield* new DockerCommandError({
      message: `Failed to pull ${image} (exit code ${pullCode})`,
      exitCode: pullCode
    })
  }
})

type ContainerOptions = {
  readonly name: string
  readonly image: string
  readonly runArgs: ReadonlyArray<string>
}

const createContainer = Effect.fnUntraced(function*({ name, image, runArgs }: ContainerOptions) {
  yield* ensureImagePulled(image)
  const code = yield* pipe(
    docker("run", "--name", name, ...runArgs, "--detach", image),
    exitCode
  )
  if (code !== 0) {
    return yield* new DockerCommandError({
      message: `Failed to create container '${name}' (exit code ${code})`,
      exitCode: code
    })
  }
  yield* Effect.log(`Created and started container '${name}'`)
})

/*
 * `waitUntilReady` is skipped when the container is already running.
 */
export const ensureContainerRunning = Effect.fnUntraced(function*<E, R>(
  options: ContainerOptions & {
    readonly waitUntilReady: Effect.Effect<void, E, R>
  }
) {
  const running = yield* isContainerRunning(options.name)
  if (running) {
    yield* Effect.log(`Container '${options.name}' is already running`)
    return
  }

  const exists = yield* doesContainerExist(options.name)
  if (exists) {
    yield* startExistingContainer(options.name)
  } else {
    yield* createContainer(options)
  }
  yield* options.waitUntilReady
})
