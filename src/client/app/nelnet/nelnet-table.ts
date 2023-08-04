export interface column {
    name: string,
    type: string
}
  
export interface table {
    data: {
      columns: column[],
      rows: any[]
    },
    message: string
}