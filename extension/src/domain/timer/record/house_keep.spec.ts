import { fakeFocusSessionRecordsStorageService } from '@/infra/storage/factories/fake'
import { describe, expect, it } from 'vitest'
import { newFocusSessionRecord, type FocusSessionRecord } from '.'
import { FocusSessionRecordHousekeeper } from './house_keep'

describe('FocusSessionRecordHousekeeper', () => {
  it('should delete records older than specific periods', async () => {
    const focusSessionRecordsStorageService = fakeFocusSessionRecordsStorageService()

    const originalRecords: FocusSessionRecord[] = [
      newFocusSessionRecord({ completedAt: new Date('2025-02-03T10:59:59') }),
      newFocusSessionRecord({ completedAt: new Date('2025-02-04T11:00:00') })
    ]
    await focusSessionRecordsStorageService.save(originalRecords)

    await FocusSessionRecordHousekeeper.houseKeep({
      now: new Date('2025-02-14T11:00:00'),
      focusSessionRecordsStorageService,
      houseKeepDays: 10
    })

    const newRecords = await focusSessionRecordsStorageService.get()
    expect(newRecords).toEqual([originalRecords[1]])
  })
})
