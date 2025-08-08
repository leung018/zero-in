export type FocusSessionRecord = {
  /**
   * When present, must be unique across all records (no two records can share the same startedAt timestamp)
   */
  readonly startedAt?: Date
  readonly completedAt: Date
}

export function newFocusSessionRecord({
  startedAt = undefined,
  completedAt = new Date()
}: {
  startedAt?: Date | undefined
  completedAt?: Date
} = {}): FocusSessionRecord {
  return {
    startedAt,
    completedAt
  }
}
