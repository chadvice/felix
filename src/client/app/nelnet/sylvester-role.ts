export interface SylvesterRole {
    _id: string,
    roleName: string,
    collections: {
        name: string,
        canEdit: boolean
    } []
}