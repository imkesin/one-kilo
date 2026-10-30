import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const CoachVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/CoachVersion"),
  S.annotate({
    description: "The version of a coach, incremented with every committed change.",
    identifier: "CoachVersion",
    title: "Coach Version"
  })
)
export type CoachVersion = typeof CoachVersion.Type
