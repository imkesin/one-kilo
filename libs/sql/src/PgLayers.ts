import { NodeContext } from "@effect/platform-node"
import { PgClient, PgMigrator } from "@effect/sql-pg"
import * as Config from "effect/Config"
import { identity, pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as String from "effect/String"
import { fileURLToPath } from "node:url"
import TypeOverrides from "pg/lib/type-overrides"
import { PostgresDefaults } from "./configs/Defaults.ts"

const POSTGRES_OIDS = {
  TIMESTAMP: 1114,
  TIMESTAMPTZ: 1184
} as const

type PgLayerOptions = {
  readonly defaultDatabase?: "local" | "test"
}

export const layer = (options?: PgLayerOptions) =>
  PgClient.layerConfig({
    host: pipe(
      Config.string("POSTGRES_HOST"),
      Config.withDefault(PostgresDefaults.host)
    ),
    port: pipe(
      Config.number("POSTGRES_PORT"),
      Config.withDefault(PostgresDefaults.port)
    ),

    username: pipe(
      Config.string("POSTGRES_USER"),
      Config.withDefault(PostgresDefaults.user)
    ),
    password: pipe(
      Config.string("POSTGRES_PASSWORD"),
      Config.withDefault(PostgresDefaults.password),
      (_) => Config.redacted(_)
    ),

    database: pipe(
      Config.string("POSTGRES_DB"),
      Config.withDefault(
        options?.defaultDatabase === "test"
          ? PostgresDefaults.testDB
          : PostgresDefaults.localDB
      )
    ),

    transformQueryNames: Config.succeed(String.camelToSnake),
    transformResultNames: Config.succeed(String.snakeToCamel),
    transformJson: Config.succeed(true),

    types: Config.suspend(() => {
      const override = new TypeOverrides()

      override.setTypeParser(POSTGRES_OIDS.TIMESTAMP, identity)
      override.setTypeParser(POSTGRES_OIDS.TIMESTAMPTZ, identity)

      return Config.succeed(override)
    })
  })

const layerMigrator = () =>
  pipe(
    PgMigrator.layer({
      loader: PgMigrator.fromFileSystem(
        fileURLToPath(new URL("./migrations", import.meta.url))
      )
    }),
    Layer.provide(NodeContext.layer)
  )

export const layerWithMigrations = (options?: PgLayerOptions) => Layer.provideMerge(layerMigrator(), layer(options))
