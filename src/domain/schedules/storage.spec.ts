import { beforeEach, describe, expect, it } from 'vitest'
import { Weekday, WeeklySchedule } from '.'
import { LocalStorageWrapper } from '../../infra/storage/local_storage_wrapper'
import { Time } from '../time'
import { WeeklyScheduleSchemas } from './schema'
import { WeeklyScheduleStorageService } from './storage'
import { runWeeklyScheduleStorageServiceTests } from './storage_shared_spec'

describe('WeeklyScheduleStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runWeeklyScheduleStorageServiceTests(storage)

  it('should migrate properly', async () => {
    const data: WeeklyScheduleSchemas[0] = [
      {
        weekdays: [0, 1],
        startTime: { hour: 10, minute: 59 },
        endTime: { hour: 12, minute: 12 }
      }
    ]
    storage.set(WeeklyScheduleStorageService.STORAGE_KEY, data)

    const service = new WeeklyScheduleStorageService(storage)
    const expected: WeeklySchedule[] = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.SUN, Weekday.MON]),
        startTime: new Time(10, 59),
        endTime: new Time(12, 12),
        targetFocusSessions: undefined
      })
    ]
    const result = await service.getAll()
    expect(result).toStrictEqual(expected)
  })
})
