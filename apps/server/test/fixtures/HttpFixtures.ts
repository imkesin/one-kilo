import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { HttpTestWithoutInfra } from "../../src/Http.ts"
import { TestApplicationApiClient } from "../factories/TestApiClients.ts"
import { TestUserFactory } from "../factories/TestUserFactory.ts"
import * as SqlFixtures from "../fixtures/SqlFixtures.ts"
import * as WorkOSFixtures from "../fixtures/WorkOSFixtures.ts"

export const layerTest = (options: {
  readonly suiteName: string
}) => {
  const TestOnlyLayer = Layer.merge(
    TestApplicationApiClient.Default,
    TestUserFactory.Default
  )

  return pipe(
    TestOnlyLayer,
    Layer.provideMerge(HttpTestWithoutInfra),
    Layer.provide([
      SqlFixtures.layerTest(),
      WorkOSFixtures.layerTest({ suiteName: options.suiteName })
    ])
  )
}
