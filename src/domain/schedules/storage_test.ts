import { expect, it } from 'vitest'
import { Weekday, WeeklySchedule } from '.'
import { StorageInterface } from '../../infra/storage/interface'
import { Time } from '../time'
import { WeeklyScheduleStorageService } from './storage'

export function runWeeklyScheduleStorageServiceTests(storage: StorageInterface) {
  it('should return empty array if no WeeklySchedules are saved', async () => {
    const service = new WeeklyScheduleStorageService(storage)
    expect(await service.getAll()).toStrictEqual([])
  })

  it('should save and get WeeklySchedules', async () => {
    const service = new WeeklyScheduleStorageService(storage)
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

    await service.saveAll(weeklySchedules)
    expect(await service.getAll()).toStrictEqual(weeklySchedules)
  })
}
