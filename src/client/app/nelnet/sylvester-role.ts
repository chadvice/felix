import { ObjectId } from "mongodb"

export interface SylvesterTablePermission {
    tableID: ObjectId,
    canEdit: boolean
}

export interface SylvesterRole {
    _id?: ObjectId,
    name?: string,
    description?: string,
    tablePermissions?: SylvesterTablePermission []
}