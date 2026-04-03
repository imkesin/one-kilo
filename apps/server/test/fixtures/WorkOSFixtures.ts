import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSStore from "@effect/auth-workos/Store"
import * as WorkOSTokenGenerator from "@effect/auth-workos/TokenGenerator"
import * as NodeKeyValueStore from "@effect/platform-node/NodeKeyValueStore"
import * as Encoding from "effect/Encoding"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Str from "effect/String"
import { randomBytes } from "node:crypto"
import * as Path from "node:path"

const STORE_DATA_BASE_PATH = "./test/data/auth-workos/store"

/*
 * Constructing unique data directories for each test suite helps with isolation.
 */
function buildDataDirectoryPath(suiteName: string) {
  const suiteNameInKebab = pipe(
    suiteName,
    Str.pascalToSnake,
    Str.snakeToKebab
  )

  const randomHex = Encoding.encodeHex(randomBytes(2))

  return Path.join(
    STORE_DATA_BASE_PATH,
    suiteNameInKebab,
    randomHex
  )
}

export const layerTest = (options: {
  /**
   * The name of the test suite.
   */
  readonly suiteName: string
}) => {
  const dataDirectoryPath = buildDataDirectoryPath(options.suiteName)

  const StoreLayer = pipe(
    WorkOSStore.layerTest(),
    Layer.provide(NodeKeyValueStore.layerFileSystem(dataDirectoryPath)),
    Layer.provide(WorkOSTokenGenerator.layerKeyPairTest({ authKitDomain: "test.authkit.app" }))
  )

  return pipe(
    WorkOSApiGateway.layerTest(),
    Layer.provide(StoreLayer)
  )
}
