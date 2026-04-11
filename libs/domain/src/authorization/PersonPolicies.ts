import * as Effect from "effect/Effect"
import type { PersonId } from "../ids/PersonId.ts"
import * as Policy from "./Policy.ts"

export const canManage = (personId: PersonId) =>
  Policy.policy(({ user }) => Effect.succeed(user.type === "Person" && user.person.id === personId))
