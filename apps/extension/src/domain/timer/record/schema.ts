export type FocusSessionRecordsSchemas = [
  {
    completedAt: string
  }[],
  {
    dataVersion: 1
    completedAts: string[]
  },
  {
    dataVersion: 2
    records: {
      completedAt: number
      startedAt: number | null
    }[]
  }
]
