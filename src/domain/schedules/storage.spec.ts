import { describe, expect, it } from 'vitest'
import { WeeklyScheduleStorageService } from './storage'
import { Weekday, WeeklySchedule } from '.'
import { Time } from '../time'

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
})
