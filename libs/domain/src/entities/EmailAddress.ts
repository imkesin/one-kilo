import * as S from "effect/Schema"
import { EmailAddressId } from "../ids/EmailAddressId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { EmailAddress } from "../values/EmailAddressValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

export class EmailAddressEntity extends S.TaggedClass<EmailAddressEntity>(
  "@one-kilo/domain/EmailAddressEntity"
)(
  "EmailAddressEntity",
  {
    id: EmailAddressId,
    personId: PersonId,
    value: EmailAddress,

    ...EntityAuditFields
  },
  {
    identifier: "EmailAddressEntity",
    title: "Email Address Entity",
    description: "An email address linked to a person"
  }
) {}
