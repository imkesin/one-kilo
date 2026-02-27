import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SimplifiedLatin from "./internal/SimplifiedLatin.ts"

export const FullName = pipe(
  SimplifiedLatin.Name,
  S.maxLength(128),
  S.brand("@one-kilo/domain/FullName"),
  S.annotations({
    description: "The full name of a person.",
    identifier: "FullName",
    title: "Full Name"
  })
)
export type FullName = typeof FullName.Type

export const PreferredName = pipe(
  SimplifiedLatin.Name,
  S.maxLength(64),
  S.brand("@one-kilo/domain/PreferredName"),
  S.annotations({
    description: "The preferred name of a person.",
    identifier: "PreferredName",
    title: "Preferred Name"
  })
)
export type PreferredName = typeof PreferredName.Type
