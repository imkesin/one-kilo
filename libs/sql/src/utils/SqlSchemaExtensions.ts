import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaParser from "effect/SchemaParser"
import * as SqlSchema from "effect/sql/SqlSchema"

/**
 * Like `SqlSchema.findOne`, but builds the request with the schema's constructor first.
 *
 * `SqlSchema` encodes requests verbatim, and generated variant fields (e.g. `Model.DateTimeInsert`)
 * only receive their values through constructor defaults.
 */
export const findOneWithRequestDefaults = <Req extends S.Constraint, Res extends S.Constraint, E, R>(
  options: {
    readonly Request: Req
    readonly Result: Res
    readonly execute: (request: Req["Encoded"]) => Effect.Effect<ReadonlyArray<unknown>, E, R>
  }
) => {
  const makeRequest = SchemaParser.makeEffect(options.Request)
  const findOne = SqlSchema.findOne(options)

  return (request: Req["~type.make.in"]) =>
    pipe(
      makeRequest(request),
      Effect.mapError((issue) => new S.SchemaError(issue)),
      Effect.flatMap(findOne)
    )
}
