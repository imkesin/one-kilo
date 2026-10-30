import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const PersonVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/PersonVersion"),
  S.annotate({
    description: "The version of a person, incremented with every committed change.",
    identifier: "PersonVersion",
    title: "Person Version"
  })
)
export type PersonVersion = typeof PersonVersion.Type
