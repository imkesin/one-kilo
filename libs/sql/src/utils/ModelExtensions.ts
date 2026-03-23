import * as VariantSchema from "@effect/experimental/VariantSchema"
import * as Model from "@effect/sql/Model"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as S from "effect/Schema"

const DateTimeWithDefaultNull = VariantSchema.Overrideable(
  S.NullOr(S.String),
  S.NullOr(S.DateTimeUtcFromSelf),
  {
    generate: Option.match({
      onNone: () => Effect.succeed(null),
      onSome: (dt) => Effect.succeed(dt ? DateTime.formatIso(dt) : null)
    }),
    decode: S.NullOr(S.DateTimeUtc),
    constructorDefault: () => null
  }
)

export const DateTimeArchived = Model.Field({
  select: S.NullOr(S.DateTimeUtc),
  insert: DateTimeWithDefaultNull,
  update: DateTimeWithDefaultNull,
  json: S.NullOr(S.DateTimeUtc)
})

/**
 * A field that represents a JSON(B) value stored as text in the database.
 *
 * This helps in situations where the database client is already transforming certain columns
 * into JSON objects when they are read.
 *
 * @see Model.JsonFromString
 */
export const JsonFromStringOnWrite = <S extends S.Schema.All | S.PropertySignature.All>(
  schema: S
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = S.parseJson(schema as any)

  return Model.Field({
    select: schema,
    insert: parsed,
    update: parsed
  })
}
