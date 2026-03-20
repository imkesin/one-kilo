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
