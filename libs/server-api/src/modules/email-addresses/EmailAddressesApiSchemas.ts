import { EmailAddressIdFromPrefixed } from "@one-kilo/domain/ids/EmailAddressId"
import { EmailAddress } from "@one-kilo/domain/values/EmailAddressValues"
import * as S from "effect/Schema"
import { ApiAuditFields } from "../../internal/ApiFields.ts"

export const Api_EmailAddressOnPerson = S.Struct({
  id: EmailAddressIdFromPrefixed,
  value: EmailAddress,

  ...ApiAuditFields
})
