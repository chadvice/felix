export interface column {
    name: string,
    type: string
}
  
export interface row {
    id: number,
    name: string,
    description: string,
    created_at: Date
}
  
export interface table {
    data: {
      columns: column[],
      rows: row[]
    },
    message: string
}