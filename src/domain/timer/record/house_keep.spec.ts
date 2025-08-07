import { describe, expect, it } from 'vitest'
import { newFocusSessionRecord, type FocusSessionRecord } from '.'
import { FocusSessionRecordHousekeeper } from './house_keep'
import { FocusSessionRecordStorageService } from './storage'

describe('FocusSessionRecordHousekeeper', () => {
  it('should delete records older than specific periods', async () => {
    const focusSessionRecordStorageService = FocusSessionRecordStorageService.createFake()

    const originalRecords: FocusSessionRecord[] = [
      newFocusSessionRecord({ completedAt: new Date('2025-02-03T10:59:59') }),
      newFocusSessionRecord({ completedAt: new Date('2025-02-04T11:00:00') })
    ]
    await focusSessionRecordStorageService.saveAll(originalRecords)

    await FocusSessionRecordHousekeeper.houseKeep({
      now: new Date('2025-02-14T11:00:00'),
      focusSessionRecordStorageService,
      houseKeepDays: 10
    })

    const newRecords = await focusSessionRecordStorageService.getAll()
    expect(newRecords).toEqual([originalRecords[1]])
  })
})
