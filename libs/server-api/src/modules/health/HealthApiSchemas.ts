import { HttpApiSchema } from "@effect/platform"
import { Schema } from "effect"

export const Health_RetrieveLiveness_ApiSchemas = {
  Success: Schema.Struct({}).annotations(HttpApiSchema.annotations({ status: 200 }))
} as const
