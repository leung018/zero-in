import type { PomodoroRecord } from '.'

type SerializedPomodoroRecord = {
  completedAt: string
}

export function serializePomodoroRecord(record: PomodoroRecord): SerializedPomodoroRecord {
  return {
    completedAt: record.completedAt.toUTCString()
  }
}

export function deserializePomodoroRecord(
  serializedRecord: SerializedPomodoroRecord
): PomodoroRecord {
  return {
    completedAt: new Date(serializedRecord.completedAt)
  }
}
