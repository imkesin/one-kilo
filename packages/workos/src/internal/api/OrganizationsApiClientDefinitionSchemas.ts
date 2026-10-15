import * as Data from "effect/Data"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { OrganizationDomainState } from "../../domain/Values.ts"

/**
 * Domain data for creating an organization.
 * This is a simplified version used in the create request,
 * not the full OrganizationDomain entity returned in responses.
 */
export const CreateOrganizationDomainData = S.Struct({
  domain: S.Trimmed.check(S.isNonEmpty()),
  state: pipe(
    OrganizationDomainState,
    S.optional
  )
})
export type CreateOrganizationDomainData = typeof CreateOrganizationDomainData.Type

export const CreateOrganizationParameters = pipe(
  S.Struct({
    name: S.Trimmed.check(S.isNonEmpty()),

    domainData: pipe(
      S.Array(CreateOrganizationDomainData),
      S.optional
    ),

    externalId: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.optional
    ),

    metadata: pipe(
      S.Record(
        S.String,
        S.Unknown
      ),
      S.optional
    )
  }),
  S.encodeKeys({
    domainData: "domain_data",
    externalId: "external_id"
  })
)
export type CreateOrganizationParameters = typeof CreateOrganizationParameters.Type

export type DeleteOrganizationOutcome = Data.TaggedEnum<{
  Success: Record<never, never>
  NotFound: Record<never, never>
}>
export const DeleteOrganizationOutcome = Data.taggedEnum<DeleteOrganizationOutcome>()
