export interface felixColumn {
    name: string,
    type: string
}
  
export interface felixTable {
    data: {
      columns: felixColumn[],
      rows: any[]
    },
    message: string
}