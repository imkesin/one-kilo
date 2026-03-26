import type { UserId } from "@one-kilo/domain/ids/UserId"

export const buildUserPageUrl = (userId: UserId) => `/u/${userId}` as const
