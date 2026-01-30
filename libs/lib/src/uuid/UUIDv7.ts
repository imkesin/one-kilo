import { Brand, Schema } from "effect"

const UUIDv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const UUIDv7 = Schema.String.pipe(
  Schema.pattern(UUIDv7Regex),
  Schema.brand("@workos-effect/lib/UUIDv7"),
  Schema.annotations({
    identifier: "UUIDv7",
    title: "UUIDv7",
    description: "A UUID version 7 (time-ordered) identifier",
  })
)
export type UUIDv7 = typeof UUIDv7.Type

