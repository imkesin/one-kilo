import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import type { Athlete } from "@one-kilo/domain/entities/Athlete"
import { AthleteIdFromPrefixed } from "@one-kilo/domain/ids/AthleteId"
import { CoachIdFromPrefixed } from "@one-kilo/domain/ids/CoachId"
import { CoachingRelationshipIdFromPrefixed } from "@one-kilo/domain/ids/CoachingRelationshipId"
import { PersonIdFromPrefixed } from "@one-kilo/domain/ids/PersonId"
import { LocalDateRange } from "@one-kilo/domain/values/LocalDateRange"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import * as S from "effect/Schema"
import { ApiAuditFields, ApiRelationAuditFields } from "../../internal/ApiFields.ts"
import { ForbiddenError } from "../../internal/ForbiddenError.ts"
import { AthletesApi_Register_PersonNotFoundError } from "./internal/AthletesApiErrors.ts"

const Api_PersonEntity = S.Struct({
  id: PersonIdFromPrefixed,
  preferredName: PreferredName,
  fullName: FullName,

  ...ApiAuditFields
})

const Api_CoachingRelationshipOnAthlete = S.Struct({
  id: CoachingRelationshipIdFromPrefixed,
  period: LocalDateRange,

  ...ApiRelationAuditFields
})

const Api_CoachOnAthlete = S.Struct({
  id: CoachIdFromPrefixed,
  person: Api_PersonEntity,
  relationship: Api_CoachingRelationshipOnAthlete
})

const Api_Athlete = S.Struct({
  id: AthleteIdFromPrefixed,
  person: Api_PersonEntity,
  coaches: S.Array(Api_CoachOnAthlete),

  ...ApiAuditFields
})

const AthletesApi_Register_Payload = S.Struct({
  person: S.Struct({
    id: PersonIdFromPrefixed
  })
})

class AthletesApi_Register_Registered extends S.TaggedClass<AthletesApi_Register_Registered>(
  "@one-kilo/server-api/Register:Registered"
)(
  "Register:Registered",
  {
    athlete: Api_Athlete
  },
  HttpApiSchema.annotations({ status: 201 })
) {
  static fromDomain = (athlete: Athlete) => AthletesApi_Register_Registered.make({ athlete })
}

class AthletesApi_Register_AlreadyRegistered extends S.TaggedClass<AthletesApi_Register_AlreadyRegistered>(
  "@one-kilo/server-api/Register:AlreadyRegistered"
)(
  "Register:AlreadyRegistered",
  {
    athlete: Api_Athlete
  },
  HttpApiSchema.annotations({ status: 200 })
) {
  static fromDomain = (athlete: Athlete) => AthletesApi_Register_AlreadyRegistered.make({ athlete })
}

export const AthletesApi_RegisterSchemas = {
  Payload: AthletesApi_Register_Payload,
  Registered: AthletesApi_Register_Registered,
  AlreadyRegistered: AthletesApi_Register_AlreadyRegistered,
  Error: {
    PersonNotFound: AthletesApi_Register_PersonNotFoundError,
    Forbidden: ForbiddenError
  }
} as const
