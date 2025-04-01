import type { FocusSessionRecord } from '.'

type SerializedFocusSessionRecord = {
  completedAt: string
}

export function serializeFocusSessionRecord(
  record: FocusSessionRecord
): SerializedFocusSessionRecord {
  return {
    completedAt: record.completedAt.toUTCString()
  }
}

export function deserializeFocusSessionRecord(
  serializedRecord: SerializedFocusSessionRecord
): FocusSessionRecord {
  return {
    completedAt: new Date(serializedRecord.completedAt)
  }
}
