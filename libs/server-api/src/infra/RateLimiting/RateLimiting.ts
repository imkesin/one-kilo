import { HttpApiMiddleware } from "@effect/platform"

export class PublicRateLimiting extends HttpApiMiddleware.Tag<PublicRateLimiting>()("PublicRateLimiting") {}
