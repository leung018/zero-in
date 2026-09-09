import { Time } from '@zero-in/shared/domain/time/index'
import { FakeRemoteStorage } from '@zero-in/shared/infra/storage/fake'
import { beforeEach, describe, expect, it } from 'vitest'
import { WeeklySchedule } from '.'
import { LocalStorageWrapper } from '../../infra/storage/local-storage'
import { WeeklyScheduleSchemas } from './schema'
import { WeeklySchedulesStorageService } from './storage'
import { runWeeklyScheduleStorageServiceTests } from './storage-shared-spec'
import { Weekday } from './weekday'

describe('WeeklyScheduleStorageService', () => {
  let storage = FakeRemoteStorage.create()

  beforeEach(() => {
    storage = FakeRemoteStorage.create()
  })

  runWeeklyScheduleStorageServiceTests(storage)

  it('should migrate properly', async () => {
    const localStorage = LocalStorageWrapper.createFake()
    const data: WeeklyScheduleSchemas[0] = [
      {
        weekdays: [0, 1],
        startTime: { hour: 10, minute: 59 },
        endTime: { hour: 12, minute: 12 }
      }
    ]
    localStorage.set(WeeklySchedulesStorageService.STORAGE_KEY, data)

    const service = new WeeklySchedulesStorageService(localStorage)
    const expected: WeeklySchedule[] = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.SUN, Weekday.MON]),
        startTime: new Time(10, 59),
        endTime: new Time(12, 12),
        targetFocusSessions: null
      })
    ]
    const result = await service.get()
    expect(result).toStrictEqual(expected)
  })
})
