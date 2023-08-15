export interface SylvesterCollectionsDocument {
    _id: string,
    created: Date,
    name: string,
    description: string,
    fields: [
        {
            name: string,
            type: string
        }
    ]
}