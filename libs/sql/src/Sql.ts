import { NodeContext } from "@effect/platform-node"
import { PgClient, PgMigrator } from "@effect/sql-pg"
import { Config, identity, Layer, pipe, String } from "effect"
import { fileURLToPath } from "node:url"
import TypeOverrides from "pg/lib/type-overrides"

const POSTGRES_OIDS = { TIMESTAMP: 1114, TIMESTAMPTZ: 1184 } as const

const MigratorLayer = pipe(
  PgMigrator.layer({
    loader: PgMigrator.fromFileSystem(
      fileURLToPath(new URL("./migrations", import.meta.url))
    )
  }),
  Layer.provide(NodeContext.layer)
)

export const SqlLiveWithoutMigrations = PgClient.layerConfig({
  host: pipe(
    Config.string("POSTGRES_HOST"),
    Config.withDefault("localhost")
  ),
  port: pipe(
    Config.number("POSTGRES_PORT"),
    Config.withDefault(5432)
  ),

  username: pipe(
    Config.string("POSTGRES_USER"),
    Config.withDefault("postgres")
  ),
  password: pipe(
    Config.string("POSTGRES_PASSWORD"),
    Config.withDefault("postgres"),
    (_) => Config.redacted(_)
  ),

  database: pipe(
    Config.string("POSTGRES_DB"),
    Config.withDefault("one_kilo_local")
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

export const SqlLive = pipe(
  MigratorLayer,
  Layer.provideMerge(SqlLiveWithoutMigrations)
)
