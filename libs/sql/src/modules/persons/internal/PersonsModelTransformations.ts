import { PersonEntity } from "@one-kilo/domain/entities/Person"
import type { PersonsModel } from "../PersonsModel.ts"

export const toPersonEntity = ({
  id,
  preferredName,
  fullName,
  createdAt,
  updatedAt,
  archivedAt
}: typeof PersonsModel.select.Type) =>
  PersonEntity.make({
    id,
    preferredName,
    fullName,
    createdAt,
    updatedAt,
    archivedAt
  })
