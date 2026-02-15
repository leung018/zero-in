import { FakeAppBlocker } from '@/infra/app-block/interface'
import { WeeklySchedule } from '@zero-in/shared/domain/schedules/index'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { Weekday } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time'
import { newFocusSessionRecord } from '../../../packages/shared/src/domain/timer/record'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { AppBlockTogglingService } from './app-block-toggling'

describe('AppBlockTogglingService', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should set app blocking schedule only if weekly schedule is set', async () => {
    jest.setSystemTime(new Date('2026-01-05T08:00:00')) // 2026-01-05 is Monday
    const { weeklySchedulesStorageService, appBlocker, togglingService } =
      await runAppBlockToggling({
        weeklySchedules: [
          new WeeklySchedule({
            weekdaySet: new Set([Weekday.MON]),
            startTime: new Time(9, 0),
            endTime: new Time(17, 0)
          })
        ]
      })

    expect(appBlocker.getBlockingScheduleSpan()).toEqual({
      start: new Date('2026-01-05T09:00:00'),
      end: new Date('2026-01-05T17:00:00')
    })

    // After removing schedule, it should also cleared the blockingScheduleSpan
    await weeklySchedulesStorageService.save([])
    await togglingService.run()

    expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
  })

  it.skip('should only consider schedules that have not completed target focus sessions', async () => {
    jest.setSystemTime(new Date('2026-01-05T12:00:00')) // 2026-01-05 is Monday
    const { appBlocker, focusSessionRecordsStorageService, togglingService } =
      await runAppBlockToggling({
        weeklySchedules: [
          new WeeklySchedule({
            weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
            startTime: new Time(9, 0),
            endTime: new Time(17, 0),
            targetFocusSessions: 2
          })
        ],
        focusSessionRecords: [
          newFocusSessionRecord({
            completedAt: new Date('2026-01-04T10:00:00')
          }),
          newFocusSessionRecord({
            completedAt: new Date('2026-01-05T10:00:00')
          })
        ]
      })

    expect(appBlocker.getBlockingScheduleSpan()).toEqual({
      start: new Date('2026-01-05T09:00:00'),
      end: new Date('2026-01-05T17:00:00')
    })

    // After adding another completed focus session within Monday schedule, it should consider the schedule as completed
    await focusSessionRecordsStorageService.save([
      newFocusSessionRecord({
        completedAt: new Date('2026-01-05T11:00:00')
      })
    ])

    await togglingService.run()

    expect(appBlocker.getBlockingScheduleSpan()).toEqual({
      start: new Date('2026-01-06T09:00:00'),
      end: new Date('2026-01-06T17:00:00')
    })
  })

  it('should always block app only if no schedule is set', async () => {
    const { appBlocker, weeklySchedulesStorageService, togglingService } =
      await runAppBlockToggling({
        weeklySchedules: []
      })

    expect(appBlocker.getBlockingScheduleSpan()).toBeNull()
    expect(appBlocker.getIsAppBlocked()).toBe(true)

    // After setting a non current schedule, it should unblock app
    await weeklySchedulesStorageService.save([
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON]),
        startTime: new Time(9, 0),
        endTime: new Time(17, 0)
      })
    ])

    jest.setSystemTime(new Date('2026-01-05T08:00:00')) // 2026-01-05 is Monday
    await togglingService.run()

    expect(appBlocker.getBlockingScheduleSpan()).not.toBeNull()
    expect(appBlocker.getIsAppBlocked()).toBe(false)
  })
})

async function runAppBlockToggling({
  weeklySchedules = [
    new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(9, 0),
      endTime: new Time(17, 0)
    })
  ],
  focusSessionRecords = [newFocusSessionRecord()]
} = {}) {
  const weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake()
  const focusSessionRecordsStorageService = FocusSessionRecordsStorageService.createFake()
  const appBlocker = new FakeAppBlocker()
  const togglingService = AppBlockTogglingService.createFake({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    appBlocker
  })

  await weeklySchedulesStorageService.save(weeklySchedules)
  await focusSessionRecordsStorageService.save(focusSessionRecords)

  const blockingScheduleSpan = await togglingService.run()

  expect(blockingScheduleSpan).toEqual(appBlocker.getBlockingScheduleSpan())

  return {
    weeklySchedulesStorageService,
    appBlocker,
    togglingService,
    focusSessionRecordsStorageService
  }
}
