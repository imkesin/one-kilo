import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const AccountVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/AccountVersion"),
  S.annotate({
    description: "The version of an account, incremented with every committed change.",
    identifier: "AccountVersion",
    title: "Account Version"
  })
)
export type AccountVersion = typeof AccountVersion.Type
