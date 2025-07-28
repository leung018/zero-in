import type { FocusSessionRecord } from '.'
import { FocusSessionRecordsSchemas } from './schema'

type SerializedFocusSessionRecords = FocusSessionRecordsSchemas[1]

export function serializeFocusSessionRecords(
  records: FocusSessionRecord[]
): SerializedFocusSessionRecords {
  return {
    dataVersion: 1,
    completedAts: records.map((record) => record.completedAt.toUTCString())
  }
}

export function deserializeFocusSessionRecords(
  serializedRecords: SerializedFocusSessionRecords
): FocusSessionRecord[] {
  return serializedRecords.completedAts.map((completedAt) => ({
    completedAt: new Date(completedAt)
  }))
}
