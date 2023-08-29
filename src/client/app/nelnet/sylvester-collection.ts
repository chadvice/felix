import { ObjectId } from "mongodb"

export interface SylvesterDocumentField {
    name: string,
    type: string
}

export interface SylvesterCollectionsDocument {
    _id: ObjectId,
    created: Date,
    name: string,
    description: string,
    fields: SylvesterDocumentField[]
}

export interface SylvesterCollection {
    description: string,
    columns: SylvesterDocumentField[],
    rows: any[]
}