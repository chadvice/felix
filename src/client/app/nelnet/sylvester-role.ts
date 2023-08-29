export interface SylvesterRole {
    _id: string,
    name: string,
    description?: string,
    collections: {
        name: string,
        canEdit: boolean
    } []
}