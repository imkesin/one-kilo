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
  { ...EntityBaseFields },
  {
    identifier: "PersonEntity",
    title: "Person Entity",
    description: "A minimal person entity"
  }
) {}

export class Person extends S.TaggedClass<Person>("@one-kilo/domain/Person")(
  "Person",
  {
    ...EntityBaseFields
  },
  {
    identifier: "Person",
    title: "Person",
    description: "A person within the system."
  }
) {}
