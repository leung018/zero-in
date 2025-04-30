export type FocusSessionRecord = {
  readonly completedAt: Date
}

export function newFocusSessionRecord(completedAt: Date = new Date()): FocusSessionRecord {
  return {
    completedAt
  }
}
