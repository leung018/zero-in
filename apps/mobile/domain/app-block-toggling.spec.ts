import { WeeklySchedule } from '@zero-in/shared/domain/schedules/index'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { Weekday } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time'
import { AppBlockTogglingService, FakeAppBlocker } from './app-block-toggling'

describe('AppBlockTogglingService', () => {
  it('should activate app block for next scheduled time', async () => {
    const weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake()
    const appBlocker = new FakeAppBlocker()
    const service = AppBlockTogglingService.createFake({
      weeklySchedulesStorageService,
      appBlocker
    })

    await weeklySchedulesStorageService.save([
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON]),
        startTime: new Time(9, 0),
        endTime: new Time(17, 0)
      })
    ])

    await service.run(new Date('2026-01-05T08:00:00'))

    expect(appBlocker.getBlockingScheduleSpan()).toEqual({
      start: new Date('2026-01-05T09:00:00'),
      end: new Date('2026-01-05T17:00:00')
    })
  })
})
