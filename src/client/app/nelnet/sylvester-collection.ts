export interface SylvesterDocumentField {
    name: string,
    type: string
}

export interface SylvesterCollectionsDocument {
    _id: string,
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