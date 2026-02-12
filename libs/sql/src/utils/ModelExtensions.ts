import { VariantSchema } from "@effect/experimental"
import { Model } from "@effect/sql"
import { DateTime, Effect, Option, Schema } from "effect"

const DateTimeWithDefaultNull = VariantSchema.Overrideable(
  Schema.NullOr(Schema.String),
  Schema.NullOr(Schema.DateTimeUtcFromSelf),
  {
    generate: Option.match({
      onNone: () => Effect.succeed(null),
      onSome: (dt) => Effect.succeed(dt ? DateTime.formatIso(dt) : null)
    }),
    decode: Schema.NullOr(Schema.DateTimeUtc),
    constructorDefault: () => null
  }
)

export const DateTimeArchived = Model.Field({
  select: Schema.NullOr(Schema.DateTimeUtc),
  insert: DateTimeWithDefaultNull,
  update: DateTimeWithDefaultNull,
  json: Schema.NullOr(Schema.DateTimeUtc)
})
