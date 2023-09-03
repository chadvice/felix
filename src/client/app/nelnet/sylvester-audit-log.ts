import { ObjectId } from "mongodb";

export interface SylvesterAuditLog {
    _id: ObjectId,
    timeStamp: Date,
    userID: string,
    firstName: string,
    lastName: string,
    message: string
}

export interface SylvesterAuditLogDetail {
    _id: ObjectId,
    timeStamp: Date,
    userID: string,
    firstName: string,
    lastName: string,
    message: string,
    description?: string,
    oldData?: any,
    newData?: any
}