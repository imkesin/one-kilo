import * as S from "effect/Schema"
import { PersonId } from "../ids/PersonId.ts"
import { FullName, PreferredName } from "../values/PersonValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: PersonId,

  preferredName: PreferredName,
  fullName: FullName,

  ...EntityAuditFields
} as const

export class PersonEntity extends S.TaggedClass<PersonEntity>("@one-kilo/domain/PersonEntity")(
  "PersonEntity",
  {
    ...EntityBaseFields
  },
  {
    identifier: "PersonEntity",
    title: "Person Entity",
    description: "A minimal person entity"
  }
) {}

export class PersonOnUser extends S.TaggedClass<PersonOnUser>("@one-kilo/domain/PersonOnUser")(
  "PersonOnUser",
  {
    ...EntityBaseFields
  },
  {
    identifier: "PersonOnUser",
    title: "Person (on User)",
    description: "A person linked to a user"
  }
) {}
