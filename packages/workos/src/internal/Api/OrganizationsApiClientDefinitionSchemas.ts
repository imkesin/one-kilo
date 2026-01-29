import * as Data from "effect/Data"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { OrganizationDomainState } from "../../domain/Values.ts"

/**
 * Domain data for creating an organization.
 * This is a simplified version used in the create request,
 * not the full OrganizationDomain entity returned in responses.
 */
export class CreateOrganizationDomainData extends S.Class<CreateOrganizationDomainData>(
  "CreateOrganizationDomainData"
)({
  domain: S.NonEmptyTrimmedString,
  state: pipe(
    OrganizationDomainState,
    S.optional
  )
}) {}

export class CreateOrganizationParameters extends S.Class<CreateOrganizationParameters>(
  "CreateOrganizationParameters"
)({
  name: S.NonEmptyTrimmedString,

  domainData: pipe(
    S.Array(CreateOrganizationDomainData),
    S.optional,
    S.fromKey("domain_data")
  ),

  externalId: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("external_id")
  ),

  metadata: pipe(
    S.Record({
      key: S.String,
      value: S.Unknown
    }),
    S.optional
  )
}) {}

export type DeleteOrganizationResponse = Data.TaggedEnum<{
  Success: Record<never, never>
  NotFound: Record<never, never>
}>
export const DeleteOrganizationResponse = Data.taggedEnum<DeleteOrganizationResponse>()
