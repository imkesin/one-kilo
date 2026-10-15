import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import * as Model from "effect/schema/Model"
import * as VariantSchema from "effect/schema/VariantSchema"

const DateTimeWithDefaultNull = VariantSchema.Overrideable(
  S.NullOr(S.DateTimeUtcFromString),
  { defaultValue: Effect.succeed(null) }
)

export const DateTimeArchived = Model.Field({
  select: S.NullOr(S.DateTimeUtcFromString),
  insert: DateTimeWithDefaultNull,
  update: DateTimeWithDefaultNull,
  json: S.NullOr(S.DateTimeUtcFromString)
})

export const DateTimeNullable = Model.Field({
  select: S.NullOr(S.DateTimeUtcFromString),
  insert: DateTimeWithDefaultNull,
  update: DateTimeWithDefaultNull,
  json: S.NullOr(S.DateTimeUtcFromString)
})

/**
 * A field that represents a JSON(B) value stored as text in the database.
 *
 * This helps in situations where the database client is already transforming certain columns
 * into JSON objects when they are read.
 *
 * @see Model.JsonFromString
 */
export const JsonFromStringOnWrite = <Schema extends S.Top>(schema: Schema) => {
  const parsed = S.fromJsonString(schema)

  return Model.Field({
    select: schema,
    insert: parsed,
    update: parsed
  })
}
