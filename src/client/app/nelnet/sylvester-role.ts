import { ObjectId } from "mongodb"

export interface SylvesterRoleCollectionElement {
    id: ObjectId,
    canEdit: boolean
}

export interface SylvesterRole {
    _id: ObjectId,
    name: string,
    description?: string,
    collections: SylvesterRoleCollectionElement []
}