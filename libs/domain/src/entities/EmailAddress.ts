import * as S from "effect/Schema"
import { EmailAddressId } from "../ids/EmailAddressId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { EmailAddress } from "../values/EmailAddressValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: EmailAddressId,
  value: EmailAddress,

  ...EntityAuditFields
} as const

export class EmailAddressEntity extends S.TaggedClass<EmailAddressEntity>(
  "@one-kilo/domain/EmailAddressEntity"
)(
  "EmailAddressEntity",
  {
    ...EntityBaseFields,

    personId: PersonId
  },
  {
    identifier: "EmailAddressEntity",
    title: "Email Address Entity",
    description: "An email address linked to a person"
  }
) {}

export class EmailAddressOnPerson extends S.TaggedClass<EmailAddressOnPerson>(
  "@one-kilo/domain/EmailAddressOnPerson"
)(
  "EmailAddressOnPerson",
  {
    ...EntityBaseFields
  },
  {
    identifier: "EmailAddressOnPerson",
    title: "Email Address (on Person)",
    description: "An email address linked to a person"
  }
) {}
