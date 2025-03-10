export type PomodoroRecord = {
  readonly completedAt: Date
}

export function newPomodoroRecord(completedAt: Date = new Date()): PomodoroRecord {
  return {
    completedAt
  }
}
