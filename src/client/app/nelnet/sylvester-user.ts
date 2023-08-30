import { ObjectId } from "mongodb";

export interface SylvesterUser {
    userID?: string,
    firstName?: string,
    lastName?: string,
    roleIDs?: ObjectId[]
}