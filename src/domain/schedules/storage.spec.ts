import { describe, expect, it } from 'vitest'
import { Weekday, WeeklySchedule } from '.'
import { FakeStorage } from '../../infra/storage'
import { Time } from '../time'
import type { WeeklyScheduleSchemas } from './serialize'
import { WeeklyScheduleStorageService } from './storage'

describe('WeeklyScheduleStorageService', () => {
  it('should return empty array if no WeeklySchedules are saved', async () => {
    const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake()
    expect(await weeklyScheduleStorageService.getAll()).toStrictEqual([])
  })

  it('should save and get WeeklySchedules', async () => {
    const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake()
    const weeklySchedules = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
        startTime: new Time(10, 0),
        endTime: new Time(12, 0)
      }),
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.WED, Weekday.THU]),
        startTime: new Time(13, 0),
        endTime: new Time(15, 0),
        targetFocusSessions: 2
      })
    ]

    await weeklyScheduleStorageService.saveAll(weeklySchedules)
    expect(await weeklyScheduleStorageService.getAll()).toStrictEqual(weeklySchedules)
  })

  it('should migrate properly', async () => {
    const fakeStorage = new FakeStorage()
    const data: WeeklyScheduleSchemas[0] = [
      {
        weekdays: [0, 1],
        startTime: { hour: 10, minute: 59 },
        endTime: { hour: 12, minute: 12 }
      }
    ]
    fakeStorage.set({
      [WeeklyScheduleStorageService.STORAGE_KEY]: data
    })

    const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake(fakeStorage)
    const expected: WeeklySchedule[] = [
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.SUN, Weekday.MON]),
        startTime: new Time(10, 59),
        endTime: new Time(12, 12),
        targetFocusSessions: undefined
      })
    ]
    const result = await weeklyScheduleStorageService.getAll()
    expect(result).toStrictEqual(expected)
  })
})
