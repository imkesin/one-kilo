import * as S from "effect/Schema"

class HealthApi_RetrieveLiveness_Success extends S.TaggedClass<HealthApi_RetrieveLiveness_Success>()(
  "RetrieveLiveness:Success",
  {},
  { httpApiStatus: 200 }
) {}

export const HealthApi_RetrieveLivenessSchemas = { Success: HealthApi_RetrieveLiveness_Success } as const
