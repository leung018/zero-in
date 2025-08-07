export type FocusSessionRecord = {
  readonly startedAt?: Date
  readonly completedAt: Date
}

export function newFocusSessionRecord({
  startedAt = undefined,
  completedAt = new Date()
} = {}): FocusSessionRecord {
  return {
    startedAt,
    completedAt
  }
}
