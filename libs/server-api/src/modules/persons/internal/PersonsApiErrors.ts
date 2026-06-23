import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const PERSON_NOT_FOUND_ERROR_MESSAGE = "No person exists for the provided identifier"

export class PersonsApi_Update_PersonNotFoundError extends S.TaggedError<PersonsApi_Update_PersonNotFoundError>(
  "@one-kilo/server-api/Persons.Update:PersonNotFoundError"
)(
  "Persons.Update:PersonNotFoundError",
  {
    message: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.withDefaults({
        constructor: () => PERSON_NOT_FOUND_ERROR_MESSAGE,
        decoding: () => PERSON_NOT_FOUND_ERROR_MESSAGE
      })
    )
  },
  HttpApiSchema.annotations({ status: 404 })
) {}
