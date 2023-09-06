import { ObjectId } from "mongodb";

export interface SylvesterUser {
    userID?: string,
    firstName?: string,
    lastName?: string,
    roleIDs?: ObjectId[],
    canImport?: boolean,
    canExport?: boolean,
    canCreateTable?: boolean,
    canDeleteTable?: boolean,
    canAlterTable?: boolean,
    canViewAuditLogs?: boolean,
    canEditUsers?: boolean
    canEditRoles?: boolean
}