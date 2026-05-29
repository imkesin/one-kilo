import * as S from "effect/Schema"
import { PersonId } from "../ids/PersonId.ts"

export class PersonNotFoundError extends S.TaggedError<PersonNotFoundError>(
  "@one-kilo/domain/PersonNotFoundError"
)(
  "PersonNotFoundError",
  { personId: PersonId },
  { description: "No person exists for the given identifier." }
) {}
