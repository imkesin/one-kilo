import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const AthleteVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/AthleteVersion"),
  S.annotate({
    description: "The version of an athlete, incremented with every committed change.",
    identifier: "AthleteVersion",
    title: "Athlete Version"
  })
)
export type AthleteVersion = typeof AthleteVersion.Type
