import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { ClientId, EmailAddress } from "../../domain/DomainIds.ts"

export class CreateUserParameters extends S.Class<CreateUserParameters>("CreateUserParameters")({
  email: EmailAddress,

  password: pipe(
    S.NonEmptyTrimmedString,
    S.optional
  ),

  firstName: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("first_name")
  ),
  lastName: pipe(
    S.NonEmptyTrimmedString,
    S.optional,
    S.fromKey("last_name")
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

export class AuthenticateWithRefreshTokenParameters
  extends S.Class<AuthenticateWithRefreshTokenParameters>("AuthenticateWithRefreshTokenParameters")({
    clientId: pipe(
      ClientId,
      S.propertySignature,
      S.fromKey("client_id")
    ),
    clientSecret: pipe(
      S.NonEmptyTrimmedString,
      S.propertySignature,
      S.fromKey("client_secret")
    )
  })
{}
