import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const PERSON_NOT_FOUND_ERROR_MESSAGE = "No person exists for the provided identifier"

export class PersonsApi_Update_PersonNotFoundError extends S.TaggedError<PersonsApi_Update_PersonNotFoundError>(
  "@one-kilo/server-api/Persons.Update:PersonNotFoundError"
)(
  "Persons.Update:PersonNotFoundError",
  {
    message: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.withDecodingDefault(Effect.succeed(PERSON_NOT_FOUND_ERROR_MESSAGE)),
      S.withConstructorDefault(Effect.succeed(PERSON_NOT_FOUND_ERROR_MESSAGE))
    )
  },
  { httpApiStatus: 404 }
) {}
