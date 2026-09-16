import * as Effect from "effect/Effect"
import type { PersonId } from "../ids/PersonId.ts"
import * as Policy from "./Policy.ts"

export const canManage = (personId: PersonId) =>
  Policy.policy(({ account }) => Effect.succeed(account.type === "Person" && account.person.id === personId))
