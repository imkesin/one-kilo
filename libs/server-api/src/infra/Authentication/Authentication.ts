import { HttpApiMiddleware } from "@effect/platform"

export class Authentication extends HttpApiMiddleware.Tag<Authentication>()("Authentication") {}
