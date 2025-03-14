import { describe, expect, it } from 'vitest'
import { PomodoroRecordStorageService } from './storage'
import { PomodoroRecordHousekeeper } from './house_keep'
import type { PomodoroRecord } from '.'

describe('PomodoroRecordHousekeeper', () => {
  it('should delete records older than specific periods', async () => {
    const pomodoroRecordStorageService = PomodoroRecordStorageService.createFake()

    const originalRecords: PomodoroRecord[] = [
      { completedAt: new Date('2025-02-03T10:59:59') },
      { completedAt: new Date('2025-02-04T11:00:00') }
    ]
    await pomodoroRecordStorageService.saveAll(originalRecords)

    await PomodoroRecordHousekeeper.houseKeep({
      now: new Date('2025-02-14T11:00:00'),
      pomodoroRecordStorageService,
      houseKeepDays: 10
    })

    const newRecords = await pomodoroRecordStorageService.getAll()
    expect(newRecords).toEqual([originalRecords[1]])
  })
})
