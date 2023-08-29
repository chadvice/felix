export interface SylvesterRole {
    roleName: string,
    collections: {
        name: string,
        canEdit: boolean
    } []
}