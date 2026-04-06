import * as PgLayers from "@one-kilo/sql/PgLayers"

export const layerTest = () => PgLayers.layerWithMigrations({ defaultDatabase: "test" })
