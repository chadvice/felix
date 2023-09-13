import { ObjectId } from "mongodb"

export interface SylvesterColumn {
    name: string,
    type: string
}

export interface SylvesterTableSchema {
    _id?: ObjectId,
    created: Date,
    name: string,
    description: string,
    fields: SylvesterColumn[]
}

export interface SylvesterTable {
    description: string,
    columns: SylvesterColumn[],
    rows: any[]
}