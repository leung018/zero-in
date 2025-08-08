import type { FocusSessionRecord } from '.'
import { FocusSessionRecordsSchemas } from './schema'

type SerializedFocusSessionRecords = FocusSessionRecordsSchemas[2]

export function serializeFocusSessionRecords(
  records: FocusSessionRecord[]
): SerializedFocusSessionRecords {
  return {
    dataVersion: 2,
    records: records.map((record) => ({
      completedAt: record.completedAt.getTime(),
      startedAt: record.startedAt?.getTime() ?? null
    }))
  }
}

export function deserializeFocusSessionRecords(
  serializedRecords: SerializedFocusSessionRecords
): FocusSessionRecord[] {
  return serializedRecords.records.map((record) => ({
    completedAt: new Date(record.completedAt),
    startedAt: record.startedAt ? new Date(record.startedAt) : undefined
  }))
}
