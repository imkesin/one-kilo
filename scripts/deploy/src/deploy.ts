import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Argument from "effect/cli/Argument"
import * as Command from "effect/cli/Command"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import { pipe } from "effect/Function"
import * as Path from "effect/Path"
import * as ChildProcess from "effect/process/ChildProcess"
import * as ChildProcessSpawner from "effect/process/ChildProcessSpawner"
import * as S from "effect/Schema"
import * as Stream from "effect/Stream"

const APPS = ["web", "server", "runner"]

class DeployError extends S.TaggedError<DeployError>("@one-kilo/deploy/DeployError")(
  "DeployError",
  {
    message: S.String
  }
) {}

const exitCode = (command: string, args: ReadonlyArray<string>, options: ChildProcess.CommandOptions) =>
  Effect.flatMap(
    ChildProcessSpawner.ChildProcessSpawner,
    (spawner) => spawner.exitCode(ChildProcess.make(command, args, options))
  )

const ensureSuccess = (command: string, args: ReadonlyArray<string>) => (code: number) =>
  code === 0
    ? Effect.void
    : Effect.fail(new DeployError({ message: `\`${[command, ...args].join(" ")}\` exited with code ${code}` }))

/*
 * Inherited stdio and the parent's process group make the child behave as if typed into the shell: it owns the
 * terminal and receives Ctrl-C directly.
 */
const run = (command: string, args: ReadonlyArray<string>, cwd: string) =>
  pipe(
    exitCode(command, args, { cwd, stdin: "inherit", stdout: "inherit", stderr: "inherit", detached: false }),
    Effect.flatMap(ensureSuccess(command, args))
  )

const output = Effect.fnUntraced(function*(command: string, args: ReadonlyArray<string>, cwd?: string) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const handle = yield* spawner.spawn(ChildProcess.make(command, args, { cwd, stderr: "inherit" }))
  const [stdout, code] = yield* Effect.all(
    [pipe(handle.stdout, Stream.decodeText(), Stream.mkString), handle.exitCode],
    { concurrency: "unbounded" }
  )
  yield* ensureSuccess(command, args)(code)
  return stdout.trim()
}, Effect.scoped)

const ensureImageExists = (image: string) =>
  pipe(
    exitCode("gcloud", ["artifacts", "docker", "images", "describe", image], { stdout: "ignore", stderr: "inherit" }),
    Effect.flatMap((code) =>
      code === 0
        ? Effect.void
        : Effect.fail(new DeployError({ message: `Image ${image} not found; wait for CI to push it` }))
    )
  )

const deploy = Effect.fnUntraced(function*({ stack }: { readonly stack: string }) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const root = yield* output("git", ["rev-parse", "--show-toplevel"])
  const pulumiDirectory = path.join(root, "infra", "pulumi")

  if ((yield* output("git", ["status", "--porcelain"], root)) !== "") {
    return yield* new DeployError({ message: "Working tree is dirty; commit and push before deploying" })
  }

  yield* run("git", ["fetch", "--quiet", "origin", "main"], root)
  const sha = yield* output("git", ["rev-parse", "HEAD"], root)
  const onMain = yield* exitCode("git", ["merge-base", "--is-ancestor", sha, "origin/main"], { cwd: root })
  if (onMain !== 0) {
    return yield* new DeployError({ message: `HEAD (${sha}) is not on origin/main; CI only pushes images for main` })
  }

  const organization = yield* output("pulumi", ["org", "get-default"])
  const registry = yield* output(
    "pulumi",
    ["stack", "output", "imageRepositoryUrl", "--stack", `${organization}/one-kilo-bootstrap/${stack}`]
  )
  yield* Effect.forEach(
    APPS,
    (app) => ensureImageExists(`${registry}/${app}:${sha}`),
    { concurrency: "unbounded", discard: true }
  )

  yield* run("pnpm", ["turbo", "build", "--filter=@one-kilo/pulumi..."], root)

  /*
   * A throwaway copy of the stack config keeps the image tag out of the committed `Pulumi.<stack>.yaml`.
   */
  const configFile = path.join(yield* fs.makeTempDirectoryScoped(), `Pulumi.${stack}.yaml`)
  yield* fs.copyFile(path.join(pulumiDirectory, `Pulumi.${stack}.yaml`), configFile)
  yield* run(
    "pulumi",
    ["config", "set", "image-tag", sha, "--stack", stack, "--config-file", configFile],
    pulumiDirectory
  )

  yield* Effect.log(`Deploying ${sha} to ${stack}`)

  /*
   * Interrupting would SIGTERM Pulumi mid-update. Pulumi already received the terminal's Ctrl-C, so wait for it to
   * cancel gracefully and exit on its own.
   */
  yield* Effect.uninterruptible(
    run("pulumi", ["up", "--stack", stack, "--config-file", configFile], pulumiDirectory)
  )
}, Effect.scoped)

const command = pipe(
  Command.make(
    "deploy",
    {
      stack: pipe(Argument.String("stack"), Argument.withDescription("Pulumi stack to deploy"))
    },
    deploy
  ),
  Command.withDescription("Deploy HEAD to a Pulumi stack using the images CI pushed for it")
)

pipe(
  command,
  Command.run({ version: "0.0.0" }),
  // oxlint-disable-next-line effecttsgo/strict-effect-provide -- script entry point
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
)
