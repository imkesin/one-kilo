import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const EmailAddressVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/EmailAddressVersion"),
  S.annotate({
    description: "The version of an email address, incremented with every committed change.",
    identifier: "EmailAddressVersion",
    title: "Email Address Version"
  })
)
export type EmailAddressVersion = typeof EmailAddressVersion.Type
