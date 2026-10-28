import * as NodeServices from "@effect/platform-node/NodeServices"
import * as PgClient from "@effect/sql-pg/PgClient"
import * as PgMigrator from "@effect/sql-pg/PgMigrator"
import * as PgTypes from "@effect/sql-pg/PgTypes"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Redacted from "effect/Redacted"
import * as Result from "effect/Result"
import * as String from "effect/String"
import { fileURLToPath } from "node:url"
import { PostgresDefaults } from "./configs/Defaults.ts"

type PgLayerOptions = {
  readonly defaultDatabase?: "local" | "test"
}

const PG_EPOCH_MS = Date.UTC(2000, 0, 1)
const PG_INFINITY = 9223372036854775807n
const PG_NEGATIVE_INFINITY = -9223372036854775808n

/*
 * Timestamps decode to ISO-8601 strings rather than `Date`s, so that model schemas read top-level columns and
 * `JSONB_BUILD_OBJECT` fields (where Postgres already renders timestamps as text) through the same string codecs.
 */
const makeTimestampAsStringCodec = (oid: number): PgTypes.Codec<string | Date | number> => ({
  decode: (bytes) => {
    if (bytes.byteLength !== 8) {
      return Result.fail(
        new PgTypes.CodecError({ message: `Expected 8 bytes for a timestamp, got ${bytes.byteLength}` })
      )
    }

    const micros = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigInt64(0)
    if (micros === PG_INFINITY) {
      return Result.succeed("infinity")
    }
    if (micros === PG_NEGATIVE_INFINITY) {
      return Result.succeed("-infinity")
    }

    const date = new Date(Number(micros / 1000n) + PG_EPOCH_MS)

    return Number.isNaN(date.getTime())
      ? Result.fail(new PgTypes.CodecError({ message: `Timestamp out of range: ${micros} microseconds` }))
      : Result.succeed(date.toISOString())
  },
  encode: (value) => PgTypes.encode(typeof value === "string" ? new Date(value) : value, oid)
})

const makeTypes = () => {
  const registry = PgTypes.makeRegistry()

  registry.register(
    PgTypes.OID.timestamp,
    makeTimestampAsStringCodec(PgTypes.OID.timestamp),
    { arrayOid: PgTypes.OID.timestampArray }
  )
  registry.register(
    PgTypes.OID.timestamptz,
    makeTimestampAsStringCodec(PgTypes.OID.timestamptz),
    { arrayOid: PgTypes.OID.timestamptzArray }
  )

  return registry
}

export const layer = (options?: PgLayerOptions) =>
  PgClient.layerConfig({
    host: pipe(
      Config.String("POSTGRES_HOST"),
      Config.withDefault(PostgresDefaults.host)
    ),
    port: pipe(
      Config.Number("POSTGRES_PORT"),
      Config.withDefault(PostgresDefaults.port)
    ),
    ssl: pipe(
      Config.Boolean("POSTGRES_SSL"),
      Config.withDefault(PostgresDefaults.ssl)
    ),

    username: pipe(
      Config.String("POSTGRES_USER"),
      Config.withDefault(PostgresDefaults.user)
    ),
    password: pipe(
      Config.Redacted("POSTGRES_PASSWORD"),
      Config.withDefault(Redacted.make(PostgresDefaults.password))
    ),

    database: pipe(
      Config.String("POSTGRES_DB"),
      Config.withDefault(
        options?.defaultDatabase === "test"
          ? PostgresDefaults.testDB
          : PostgresDefaults.localDB
      )
    ),

    transformQueryNames: Config.succeed(String.camelToSnake),
    transformResultNames: Config.succeed(String.snakeToCamel),
    transformJson: Config.succeed(true),

    types: Config.succeed(makeTypes())
  })

const layerMigrator = () => {
  const path = fileURLToPath(new URL("./migrations", import.meta.url))

  return pipe(
    PgMigrator.layer({
      loader: PgMigrator.fromFileSystem(path),
      schemaDirectory: path
    }),
    Layer.provide(NodeServices.layer)
  )
}

export const layerWithMigrations = (options?: PgLayerOptions) => Layer.provideMerge(layerMigrator(), layer(options))
