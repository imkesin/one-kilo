import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SimplifiedLatin from "./internal/SimplifiedLatin.ts"

export const FullName = pipe(
  SimplifiedLatin.Name,
  S.check(S.isMaxLength(128)),
  S.brand("@one-kilo/domain/FullName"),
  S.annotate({
    description: "The full name of a person",
    identifier: "FullName",
    title: "Full Name"
  })
)
export type FullName = typeof FullName.Type

export const PreferredName = pipe(
  SimplifiedLatin.Name,
  S.check(S.isMaxLength(64)),
  S.brand("@one-kilo/domain/PreferredName"),
  S.annotate({
    description: "The preferred name of a person",
    identifier: "PreferredName",
    title: "Preferred Name"
  })
)
export type PreferredName = typeof PreferredName.Type

export const Sex = pipe(
  S.Literals(["Male", "Female"]),
  S.annotate({
    description: "The biological sex of a person, used for athletic calculations",
    identifier: "Sex",
    title: "Sex"
  })
)
export type Sex = typeof Sex.Type

/*
 * `Intl.supportedValuesOf` omits `UTC` (and all `Etc/*`), but `UTC` is the canonical identifier
 * for the UTC zone per ECMA-402, so it is always valid and must be included explicitly.
 */
const supportedTimezones = new Set([...Intl.supportedValuesOf("timeZone"), "UTC"])

export const Timezone = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(
    S.makeFilter((timezone) => supportedTimezones.has(timezone) || `${timezone} is not a valid IANA time zone`)
  ),
  S.brand("@one-kilo/domain/Timezone"),
  S.annotate({
    description: "An IANA time zone identifier (e.g. \"America/New_York\")",
    identifier: "Timezone",
    title: "Timezone"
  })
)
export type Timezone = typeof Timezone.Type
